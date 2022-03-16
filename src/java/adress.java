/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import javax.websocket.Session;

/**
 *
 * @author Safi
 */
public class adress {
    private String username = "";
    private Session serverSession;
    
    public adress(){}
    
    public adress(String username, Session serverSession){
        this.username = username;
        this.serverSession = serverSession;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Session getServerSession() {
        return serverSession;
    }

    public void setServerSession(Session serverSession) {
        this.serverSession = serverSession;
    }
}
