
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

    @OnOpen
    public void onOpen(Session peer) {
        System.out.println(peer);
    }

    @OnClose
    public void onClose(Session peer) {
        System.out.println(peer);
    }

    @OnMessage
    public void onMessage (Session session , String message) throws ParseException {
        System.out.println(message);
        
        JSONParser parser = new JSONParser();
        JSONObject json = (JSONObject) parser.parse(message);
        
        if (json.get("event").equals("roundStart")){
            
        }
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

