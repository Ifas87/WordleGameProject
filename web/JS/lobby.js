/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

console.log("Active");

var host = sessionStorage.getItem('hostUsername');
var guest = sessionStorage.getItem('username');
var reloadBuffer = sessionStorage.getItem('intialConnect');

var isHost = false;
var gameID = sessionStorage.getItem('gameID');

var endpoint = "ws://"+document.location.host+"/GameProject/lobbier";
var websocket = new WebSocket(endpoint);

var endpointGame = "ws://"+document.location.host+"/GameProject/game";
var websocketNew = new WebSocket(endpointGame);

console.log(endpoint);

var chatbox = document.querySelector(".text_holder3");
var textarea = document.getElementById("textarea");



function send(obj) {
    websocket.send(JSON.stringify(obj));
}

window.onload = function() {
    document.querySelector(".options").style.visibility = "hidden";
    
    if(host != null){
        isHost = true;
        document.querySelector(".options").style.visibility = "visible";
    }
    
    console.log(gameID + " " + host + " " + guest + " " + isHost);
    document.getElementById("gameIDinsert").innerHTML = ("GameID: " + gameID);
    document.querySelector(".text_holder1").innerHTML = (isHost ? host : guest);
    
    let packet = {
        event : (isHost ? "lobbyStart" : "lobbyJoin"),
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    if(reloadBuffer == null){
        websocket.onopen = () => send(packet);
        sessionStorage.setItem('intialConnect', true);
    }
    //send(packet);
};

websocket.onmessage = function(evt) {
    let message = JSON.parse(evt.data);
    
    if (message["event"] === "incorrectLobby")
        lobbyFailure(message);
    else if (message["event"] === "playerJoin")
        playerJoin(message, message["guest"]);
    else if (message["event"] === "chatMessage")
        receiveMessage(message);
    else if (message["event"] === "gameStart")
        gameStartReact(message);
};



document.getElementById("chatBroadcast").addEventListener("click", postMessage);
document.getElementById("starter").addEventListener("click", gameStart);

function postMessage(){
    console.log("Working");
    let text = (isHost ? host : guest) + ": " + textarea.value;
    
    //document.querySelector(".text_holder3").innerHTML += `${text}<br>`;
    
    let packet = {
        event : "chatMessage",
        sender : (isHost ? host : guest),
        game : (""+gameID),
        message : text
    };
    send(packet);
    textarea.value = "";
}

function lobbyFailure(obj){
    alert(obj["message"]);
    var redirect = obj["redirect"]; //"http://localhost:8080/GameProject";
    window.location.replace(redirect);
}

function playerJoin(obj, str){
    let current = document.querySelector(".text_holder1").innerHTML;
    if (!current.includes(str))
        document.querySelector(".text_holder1").innerHTML += `<br>${str}`;
}

function receiveMessage(obj){
    let current = document.querySelector(".text_holder1").innerHTML;
    let str = obj["message"];
    
    document.querySelector(".text_holder3").innerHTML += `<br>${str}`;
}

function gameStart(){
    let packet = {
        event : "gameStart",
        sender : (isHost ? host : guest),
        game : (""+gameID),
        rounds : (document.getElementById("sections")).value,
        time : (document.getElementById("sections2")).value
    };
    
    send(packet);
    
    sessionStorage.setItem('max_time', (document.getElementById("sections")).value);
    sessionStorage.setItem('rounds', (document.getElementById("sections2")).value);
}

function gameStartReact(obj){
    sessionStorage.setItem('max_time', obj["rounds"]);
    sessionStorage.setItem('rounds', obj["time"]);
    
    websocket.close();
    window.location.href = obj["message"];
}