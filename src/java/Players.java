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
import org.json.JSONException;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.json.simple.JSONArray;


/**
 *
 * @author Safi
 *
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
            System.out.println("finding lobby "+elem.toJSONString());
            if(gameID.equals(""+elem.get("gameID")))
                result = elem;
        }
        return result;
    }
    
    public void returnWords(JSONObject obj) throws IOException{
        JSONObject gameLobby = findLobbybyId(""+obj.get("game"));
        String[] words = new String[20];
        
        int randomIndex = (int)(Math.random()*(10));
        InputStream txt = (adress.class.getResourceAsStream("words.txt"));
        
        JSONArray lister = new JSONArray();
        
        Scanner scanner = new Scanner(txt);
        int count = 0;
        int newIndex = 0;
        while (scanner.hasNextLine()) {
            String line = scanner.nextLine();
            if(count <= randomIndex){
                count+=1;
                continue;
            }
            else if (count > (randomIndex+20)){
                count+=1;
                break;
            }
            
            lister.add(line.trim());
            words[newIndex] = line.trim();
            newIndex+=1;
            count+=1;
        }
        scanner.close();
        
        System.out.println(lister.toJSONString());
        
        // public void broadCastLobby(JSONObject lobby, String exclusion, String event, String player, String message)
        broadCastLobby(gameLobby, "", "receiveWords", returnName(gameLobby, "user1"), lister.toJSONString());
    }
    
    public int countPlayers(JSONObject obj){
        int count = 0;
        for (int i=1; i<5; i++){ // !(lobby.get( ("user"+i) ) instanceof String)
            //System.out.println( ("user"+i) + " " +((obj.get( ("user"+i) )) instanceof String) + " " + obj.get( ("user"+i)) );
            if ( !((obj.get( ("user"+i) )) instanceof String))
                count++;
        }
        
        return count;
    }
    
    public void collectResults(JSONObject json) throws IOException{
        JSONObject obj = findLobbybyId( (""+json.get("game")) );
        
        System.out.println(json.get("score"));
        int newScore = Integer.parseInt(""+json.get("score"));
        String newPlayer = (String) json.get("sender");
        
        int currentScore = (int) obj.get("highscore");
        String currentPlayer = (String) obj.get("winner");
        
        if (newScore > currentScore){
            obj.put("highscore", newScore);
            obj.put("winner", newPlayer);
        }
        else if (newScore == currentScore){
            String combinedWinners = currentPlayer + " " + newPlayer;
            obj.put("winner", combinedWinners);
        }
        
        obj.put("completedCount", (Integer.parseInt(""+obj.get("completedCount")) + 1) );
        
        if ( ((int)obj.get("completedCount")) >= countPlayers(obj)){
            String results = (String) obj.get("winner") + " : " + (int) obj.get("highscore");
            System.out.println(results);
            broadCastLobby(obj, "", "lobbyWinners", "server", results);
        }
    }
    
    @OnOpen
    public void onOpen(Session peer) throws IOException {
        peers.add(peer);
        //System.out.println(peer.getId());
        this.ip = InetAddress.getLocalHost();
        hostname = this.ip.getHostAddress();
    }

    @OnClose
    public void onClose(Session peer) {
        peers.remove(peer);
    }
    
    @OnMessage
    public void onMessage (Session session , String message) throws JSONException, ParseException, IOException{
        //System.out.println(message);
        
        JSONParser parser = new JSONParser();
        JSONObject json = (JSONObject) parser.parse(message);
        
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
            players.put("highscore", 0);
            players.put("winner", "");
            players.put("completedCount", 0);
            
            gameRooms.add(players);
        }
        
        else if(json.get("event").equals("lobbyJoin")){
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
                    
                    return;
                }
            }
            wrongLobby(session, ""+json.get("game"), errNon); 
        }
        
        else if( json.get("event").equals("chatMessage") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            broadCastLobby(lobby, exclusion, "chatMessage", (""+json.get("sender")), (""+json.get("message")));
        }
        
        else if ( json.get("event").equals("gameStart") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            int rounds = Integer.parseInt((String) json.get("rounds"));
            int timer = Integer.parseInt((String) json.get("time"));
            
            for (int i=1; i<5; i++){
                System.out.println("user"+i);
                
                if ( !(lobby.get( ("user"+i) ) instanceof String) ){
                    ( (adress) lobby.get( ("user"+i) )).getServerSession().getBasicRemote().sendText( json.toJSONString() );
                }
            }
        }
        
        else if (json.get("event").equals("receiveWords")){
            returnWords(json);
        }
        
        else if (json.get("event").equals("endGame")){
            System.out.println("Activated results section");
            collectResults(json);
        }
        
        else if (json.get("event").equals("timerStart")){
            System.out.println("Timer called");
            JSONObject lobby = findLobbybyId(""+json.get("game"));
            int referenceTime = 0;
            
            Timer timer = new Timer();
            TimerTask counter = new timerTask( Integer.parseInt((String)json.get("time")), referenceTime, timer );
            
            timer.schedule(counter, 1000, 1000);
            broadCastLobby(lobby, "", "timerStart", (""+json.get("sender")), ""+referenceTime);
            
        }
        //System.out.println("GameRoom "+gameRooms.toString());
    }
}