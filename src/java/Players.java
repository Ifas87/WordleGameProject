/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// The imports necessary for the project
import java.io.IOException;
import java.util.* ;
import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.*;
import java.net.InetAddress;
import java.util.concurrent.TimeUnit;
import org.json.JSONException;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.json.simple.JSONArray;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;


/**
 *
 * @author Safi
 *
 */

// The endpoint and the class that will operate on endpoint requests
@ServerEndpoint ("/lobbier")
public class Players {
    // Global variablse that will be utilised later in the project
    private static ArrayList<JSONObject> gameRooms = new ArrayList<JSONObject>();
    private final static String errMax = "Max players in lobby";
    private final static String errNon = "No lobbies present by that ID";
    private final static String errAlr = "Lobby already exists";
    private final static String errHos = "Host left the game";
    private final static String errSam = "Username is similar to other players";
    
    // IP address variables
    InetAddress ip;
    String hostname;
    
    /*
    * The function that triggers when a wrong scenario is triggered
    * @param The user session, gameID and the response for the alert
    * @returns none
    */
    public void wrongLobby(Session session, String gameID, String message) throws IOException{
        JSONObject players = new JSONObject();
        players.put("game", gameID);
        players.put("event", "incorrectLobby");
        players.put("sender", "server");
        players.put("message", message);
        players.put("redirect", "http://" + hostname + ":8080/GameProject/");
        
        session.getBasicRemote().sendText(players.toJSONString());
    }
    
    /*
    * The essential broadcast function that sends a JSONobject message to all users in a JSONObject
    * lobby
    * @param The target lobby, the user to exclude from the message, the string event to send the message under,
    * the player for a lobbyJoin scenario, the string message that acts as the payload
    * @returns none
    */
    public void broadCastLobby(JSONObject lobby, String exclusion, String event, String player, String message) throws IOException{
        // Getting the user to exclude
        int originUser = (exclusion.equals("")? 0 : Integer.parseInt(exclusion.substring(exclusion.length()- 1)) );
        
        JSONObject ping = new JSONObject();
        ping.put("event", event);
        ping.put("sender", "server");
        ping.put("guest", player);
        ping.put("message", message);
        
        // Looping through the JSONObject
        for (int i=1; i<5; i++){
            if (i == originUser)
                continue;
            
            if ( !(lobby.get( ("user"+i) ) instanceof String) )
                ((adress)(lobby.get( ("user"+i) ))).getServerSession().getBasicRemote().sendText( ping.toJSONString() );
        }
    }
    
    /*
    * Function that returns the username from a user iterator in a JSONObject
    * @param the target lobby and the user iterator eg (user1)
    * @returns {undefined}
    */
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
    
    /*
    * Handler Function for the word receive event, sends a list of words from the local
    * website words file using Jsoup and broadcast to the lobby
    * @param The JSON message sent by the client
    * @returns {undefined}
    */
    public void returnWords(JSONObject obj) throws IOException{
        JSONObject gameLobby = findLobbybyId(""+obj.get("game"));
        String[] words = new String[20];
        
        // Retrieving the words.txt file from the local URL
        Document doc = Jsoup.connect("http://" + hostname + ":8080/GameProject/words.txt").get();
        String[] allwords = (doc.body().text()).split(" ");
        System.out.println( allwords.toString() );
        
        JSONArray lister = new JSONArray();
        
        // Adding 20 random words into JSONArray
        for (int i = 0; i < 20; i++) {
            int randomness = (int) (Math.random() * (29 - 1)) + 1;
            lister.add(allwords[randomness]);
        }

        System.out.println(lister.toJSONString());
        
        // Broadcast wordlist
        broadCastLobby(gameLobby, "", "receiveWords", returnName(gameLobby, "user1"), lister.toJSONString());
    }
    
    /*
    * A Function that returns the number of active players in the lobby
    * @param The target JSONObject lobby
    * @returns {undefined}
    */
    public int countPlayers(JSONObject obj){
        int count = 0;
        for (int i=1; i<5; i++){
            //System.out.println( ("user"+i) + " " +((obj.get( ("user"+i) )) instanceof String) + " " + obj.get( ("user"+i)) );
            if ( !((obj.get( ("user"+i) )) instanceof String))
                count++;
        }
        return count;
    }
    
    /*
    * A complicated function that gets the score and player name and compares each one 
    * of them individually
    * @param the JSONObject message sent
    * @returns {undefined}
    */
    public void collectResults(JSONObject json) throws IOException{
        // Getting the initial lobby
        JSONObject obj = findLobbybyId( (""+json.get("game")) );
        
        // Get the player and score information from the json message
        System.out.println(json.get("score"));
        int newScore = Integer.parseInt(""+json.get("score"));
        String newPlayer = (String) json.get("sender");
        
        // Get the current highest value from the Lobby
        int currentScore = (int) obj.get("highscore");
        String currentPlayer = (String) obj.get("winner");
        
        if (newScore > currentScore){
            obj.put("highscore", newScore);
            obj.put("winner", newPlayer);
        }
        // Two users same score user scenario
        else if (newScore == currentScore){
            String combinedWinners = currentPlayer + " " + newPlayer;
            obj.put("winner", combinedWinners);
        }
        
        // Printing the results when all users are done with the game
        obj.put("completedCount", (Integer.parseInt(""+obj.get("completedCount")) + 1) );
        System.out.println( ((int)obj.get("completedCount")) + " " + countPlayers(obj) + " " + ( ((int)obj.get("completedCount")) >= countPlayers(obj)));
        if ( ((int)obj.get("completedCount")) >= countPlayers(obj)){
            obj.put("completedCount", 0);
            String results = (String) obj.get("winner") + " : " + (int) obj.get("highscore");
            System.out.println(results);
            broadCastLobby(obj, "", "lobbyWinners", "server", results);
        }
    }
    
    public boolean checkUserNames(JSONObject lobby, String username, Session session) throws IOException{
        for(int j=1; j<5; j++){
            if( !(lobby.get( ("user"+j) ) instanceof String) ){
                if ( username.equals( ((adress) lobby.get(("user"+j))).getUsername()) ){
                    wrongLobby( session , ((String) lobby.get("gameID")), errSam);
                    return true;
                }
            }
        }
        return false;
    }
    
    // websocket Onopen function, used to get the IP address for redirects
    @OnOpen
    public void onOpen(Session peer) throws IOException {
        this.ip = InetAddress.getLocalHost();
        hostname = this.ip.getHostAddress();
    }
    
    // websocket OnClose function, used to handle players leaving ubruptily
    @OnClose
    public void onClose(Session peer) throws IOException {
        int index = 0;
        for (JSONObject elem: gameRooms){
            for(int i=1; i<5; i++){
                if( !(elem.get( ("user"+i)) instanceof String ) ){
                
                    if( peer.getId().equals( ((adress)elem.get( ("user"+i))).getServerSession().getId() ) ){
                        System.out.println("Leaving session has been found "+elem.get("gameID")+" "+i);
                        if( !(i == 1)){
                            System.out.println("In broadcaster");
                            try{
                                broadCastLobby(elem, (""+i), "playerLeaving", ((adress)elem.get( ("user"+i))).getUsername(), ((adress)elem.get( ("user"+i))).getUsername());
                                elem.put(("user"+i), "");
                            }
                            catch(IllegalStateException ie){
                                System.out.println(ie);
                            }
                            index++;
                            return;
                        }

                        for(int j=2; j<5; j++){
                            if( !(elem.get( ("user"+j) ) instanceof String) ){
                                Session session = ((adress) elem.get( ("user"+j) )).getServerSession();
                                wrongLobby(session, ((String) elem.get("gameID")), errHos);
                                gameRooms.remove(index);
                            }
                        }
                        index++;
                        return;
                    }
                    index++;
                }
            }
        }
    }
    
    // websocket onMessage function used to handle all user interaction
    @OnMessage
    public void onMessage (Session session , String message) throws JSONException, ParseException, IOException, InterruptedException{
        System.out.println(message);
        
        // JSON message parser from JSONString
        JSONParser parser = new JSONParser();
        JSONObject json = (JSONObject) parser.parse(message);
        
        // Scenario for creating new lobby objects
        if (json.get("event").equals("lobbyStart")){
            
            // A Check for the same lobby ID 
            for (JSONObject elem: gameRooms){
                if(json.get("game").equals(elem.get("gameID"))){
                    wrongLobby(session, ""+json.get("game"), errAlr);
                    return;
                }
            }
            
            // Creating the a new lobby object and add the host as user1
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
        
        // Lobbbyjoin scenario to add teh user and print their name in the player list
        else if(json.get("event").equals("lobbyJoin")){
            for (JSONObject elem: gameRooms){
                System.out.println(elem.toJSONString());
                if(json.get("game").equals(elem.get("gameID"))){
                    System.out.println("Found");
                    
                    if(checkUserNames(elem, ((String) json.get("sender")), session )){    
                        System.out.println("Called out");
                        return;
                    }
                    
                    System.out.println(elem.toJSONString());
                    
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
                        // Wrong lobby for more than 4 players
                        wrongLobby(session, ""+json.get("game"), errMax);
                        return;
                    }
                    return;
                }
            }
            // Incorrect LobbyID scenario
            wrongLobby(session, ""+json.get("game"), errNon); 
        }
        
        /*
            Scenario for receiving chat messages and broadcasting to the whole lobby
            uses the broadCastLobby method
        */
        else if( json.get("event").equals("chatMessage") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            broadCastLobby(lobby, exclusion, "chatMessage", (""+json.get("sender")), (""+json.get("message")));
        }
        
        /*
            Scenario for starting the game and setting up initial variables client side
            adds a baselink to be used for accessing the words files and audio cue
        */
        else if ( json.get("event").equals("gameStart") ){
            JSONObject lobby = findLobbybyId( ""+json.get("game") );
            String exclusion = "";
            int rounds = Integer.parseInt((String) json.get("rounds"));
            int timer = Integer.parseInt((String) json.get("time"));
            json.put("baselink", ("http://" + hostname + ":8080/GameProject/"));
            
            for (int i=1; i<5; i++){
                System.out.println("user"+i);
                
                if ( !(lobby.get( ("user"+i) ) instanceof String) ){
                    ( (adress) lobby.get( ("user"+i) )).getServerSession().getBasicRemote().sendText( json.toJSONString() );
                }
            }
        }
        
        /*
            receive words scenario handled by the returnWords function
        */
        else if (json.get("event").equals("receiveWords")){
            returnWords(json);
        }
        
        // endGame scenario triggered by each player after completing the game
        // Handled by the collectResults function which compiles and broadcasts the results
        else if (json.get("event").equals("endGame")){
            System.out.println("Activated results section");
            collectResults(json);
        }
        
        // Timer scenario that creates a timer for a lobby
        // It uses a runnable thread for concurrency
        else if (json.get("event").equals("timerUpdate")){
            JSONObject lobby = findLobbybyId(""+json.get("game"));
            System.out.println("Timer called " + ((String)json.get("sender")) );
            int referenceTime = 0;
            
            // Use of a thread for parallel timers
            Thread t1 = new Thread(new Runnable() {
                @Override
                public void run() {
                    if( referenceTime <= 0 ){
                        System.out.println("Done timing section");
                        int referenceTime = Integer.parseInt((String)json.get("time"));
                        while(referenceTime > 0){
                            referenceTime--;

                            try {
                                TimeUnit.SECONDS.sleep(1);
                                broadCastLobby(lobby, "", "timerUpdate", "sender", ""+referenceTime);
                            } catch (IOException ex) {
                                System.out.println(ex);
                            } catch (InterruptedException ex) {
                                System.out.println(ex);
                            }
                        }
                    }
                }
            });  
            t1.start();
        }
        //System.out.println("GameRoom "+gameRooms.toString());
    }
}