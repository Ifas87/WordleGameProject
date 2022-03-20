
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Safi
 */

@ServerEndpoint ("/game")
public class game {
    private static ArrayList<JSONObject> gameRooms = new ArrayList<JSONObject>();
    private static Set <Session> peers = Collections.synchronizedSet(new HashSet <Session >());
    
    
    public void addNewLobby(JSONObject obj, Session session){
        JSONObject players = new JSONObject();
        
        players.put("gameID", obj.get("game"));
        players.put("user1", new adress( ""+obj.get("sender"), session));
        players.put("user2", "");
        players.put("user3", "");
        players.put("user4", "");
            
        gameRooms.add(players);
    }
    
    public void joinLobby(JSONObject obj, Session session){
        for (JSONObject elem: gameRooms){
            if((""+obj.get("sender")).equals(elem.get("gameID"))){
                System.out.println("Found");
                    
                if(elem.get("user2").equals(""))
                    elem.put("user2", new adress( ""+obj.get("sender"), session ));
                    
                else if(elem.get("user3").equals(""))
                    elem.put("user3", new adress( ""+obj.get("sender"), session ));
                    
                else if(elem.get("user4").equals(""))
                    elem.put("user4", new adress( ""+obj.get("sender"), session ));
                
                return;
            }
        }
    }
    
    
    @OnOpen
    public void onOpen(Session peer) {
        System.out.println("New session user: " + peer);
        peers.add(peer);
    }

    @OnClose
    public void onClose(Session peer) {
        System.out.println(peer);
        peers.add(peer);
    }

    @OnMessage
    public void onMessage (Session session , String message) throws ParseException {
        System.out.println(message);
        
        JSONParser parser = new JSONParser();
        JSONObject json = (JSONObject) parser.parse(message);
        
        if (json.get("event").equals("roundStart")){
            System.out.println("Add new player");
            addNewLobby(json, session);
        }
        else if(json.get("event").equals("roundJoin")){
            System.out.println("Join new player");
            joinLobby(json, session);
        }
        
        else if(json.get("event").equals("receiveWords")){
            
        }
        
        System.out.println("Game room new: "+gameRooms.toString());
    }
}
