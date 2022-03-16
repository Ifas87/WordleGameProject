/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import java.io.IOException;
import java.util.* ;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.*;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;


/**
 *
 * @author Safi
 */

@ServerEndpoint ("/lobbier")
public class Players {
    private static Set <Session> peers = Collections.synchronizedSet(new HashSet <Session>());
    private static ArrayList<JSONObject> gameRooms = new ArrayList<JSONObject>();
    private final static String errMax = "Max players in lobby";
    private final static String errNon = "No lobbies present by that ID";
    private final static String errAlr = "Lobby already exists";
    
    InetAddress ip;
    String hostname;
    
    public void wrongLobby(Session session, String gameID, String message) throws IOException{
        JSONObject players = new JSONObject();
        players.put("game", gameID);
        players.put("event", "incorrectLobby");
        players.put("sender", "server");
        players.put("message", message);
        players.put("redirect", "http://" + hostname + ":8080/GameProject/");
        
        session.getBasicRemote().sendText(players.toJSONString());
    }
    
    public void broadCastLobby(JSONObject lobby, String exclusion, String event, String player, String message) throws IOException{
        int originUser = (exclusion.equals("")? 0 : Integer.parseInt(exclusion.substring(exclusion.length()- 1)) );
        
        JSONObject ping = new JSONObject();
        ping.put("event", event);
        ping.put("sender", "server");
        ping.put("guest", player);
        ping.put("message", message);
        
        for (int i=1; i<5; i++){
            if (i == originUser)
                continue;
            
            if ( !(lobby.get( ("user"+i) ) instanceof String) )
                ((adress)(lobby.get( ("user"+i) ))).getServerSession().getBasicRemote().sendText( ping.toJSONString() );
        }
        //session.getBasicRemote().sendText(players.toJSONString());
    }
    
    public String returnName(JSONObject lobby, String user){
        String result = ((adress)lobby.get(user)).getUsername();
        return result;
    }
    
    public JSONObject findLobbybyId(String gameID){
        JSONObject result = new JSONObject();
        
        for(JSONObject elem: gameRooms){
            System.out.println("here null "+elem.toJSONString());
            if(gameID.equals(""+elem.get("gameID")))
                result = elem;
        }
            
        
        return result;
    }
    
    @OnOpen
    public void onOpen(Session peer) throws IOException {
        peers.add(peer);
        System.out.println(peer.getId());
        this.ip = InetAddress.getLocalHost();
        hostname = this.ip.getHostAddress();
    }

    @OnClose
    public void onClose(Session peer) {
        peers.remove(peer);
    }
    
    @OnMessage
    public void onMessage (Session session , String message) throws JSONException, ParseException, IOException{
        System.out.println(message);
        
        JSONParser parser = new JSONParser();
        JSONObject json = (JSONObject) parser.parse(message);
        
        System.out.println(session);
        System.out.println(json.toJSONString());
        if (json.get("event").equals("lobbyStart")){
            
            for (JSONObject elem: gameRooms){
                if(json.get("game").equals(elem.get("gameID"))){
                    wrongLobby(session, ""+json.get("game"), errAlr);
                    return;
                }
            }
            
            JSONObject players = new JSONObject();
            players.put("gameID", json.get("game"));
            players.put("user1", new adress( ""+json.get("sender"), session ));
            players.put("user2", "");
            players.put("user3", "");
            players.put("user4", "");
            
            gameRooms.add(players);
        }
        
        else if(json.get("event").equals("lobbyJoin")){
            System.out.println("New client joining");
            for (JSONObject elem: gameRooms){
                if(json.get("game").equals(elem.get("gameID"))){
                    System.out.println("Found");
                    
                    String Exclusion = "";
                    
                    // Check users of gameRoom
                    if(elem.get("user2").equals("")){
                        elem.put("user2", new adress( ""+json.get("sender"), session )); 
                        Exclusion = "user2";
                        broadCastLobby(elem, Exclusion, "playerJoin", ""+json.get("sender"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user1"), "");
                    }
                    
                    else if(elem.get("user3").equals("")){
                        elem.put("user3", new adress( ""+json.get("sender"), session ));
                        Exclusion = "user3";
                        broadCastLobby(elem, Exclusion, "playerJoin", ""+json.get("sender"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user1"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user2"), "");
                    }
                    
                    else if(elem.get("user4").equals("")){
                        elem.put("user4", new adress( ""+json.get("sender"), session ));
                        Exclusion = "user4";
                        broadCastLobby(elem, Exclusion, "playerJoin", ""+json.get("sender"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user1"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user2"), "");
                        broadCastLobby(elem, "user1", "playerJoin", returnName(elem, "user3"), "");
                    }
                    
                    else{
                        wrongLobby(session, ""+json.get("game"), errMax);
                        return;
                    }
                    
                    System.out.println("Joining changes "+ elem.toJSONString());
                    return;
                }
            }
            wrongLobby(session, ""+json.get("game"), errNon); 
        }
        
        else if( json.get("event").equals("chatMessage") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            
            System.out.println(lobby.toJSONString());
            System.out.println("The find lobby: "+lobby.toJSONString());
            
            /*
            for (int i=1; i<5; i++){
                System.out.println("user"+i);
                
                if ( !(lobby.get( ("user"+i) ) instanceof String) )
                    if( (""+json.get("sender")).equals( ((adress)lobby.get( ("user"+i)) ).getUsername()) )
                        exclusion = "user"+i;
            }
            */
            //broadCastLobby(JSONObject lobby, String exclusion, String event, String player, String message)
            broadCastLobby(lobby, exclusion, "chatMessage", (""+json.get("sender")), (""+json.get("message")));
        }
        
        else if ( json.get("event").equals("gameStart") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            
            broadCastLobby(lobby, exclusion, "gameStart", (""+json.get("sender")), "http://" + hostname + ":8080/GameProject/game.html" );
        }
        System.out.println("GameRoom "+gameRooms.toString());
    }
    
    /*
    @OnMessage
    public void onMessage (Session session , String message) {
        System.out.println("Recieved message: " + message );
        for (Session peer : peers) {
            if (!peer.equals(session)) {
                try{
                    peer.getBasicRemote().sendText(message);
                } catch( IOException ex){
                    System.out.println(ex.getMessage());
                }
            }
        }
    }
    */
}