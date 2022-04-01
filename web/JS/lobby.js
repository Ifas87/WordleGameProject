/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

console.log("Active");

/*
 * Global variables that will be utilised throughout the program
 * Includes setting up of socket to the server endpoint
 */
var host = sessionStorage.getItem('hostUsername');
var guest = sessionStorage.getItem('username');
var reloadBuffer = sessionStorage.getItem('intialConnect');

var isHost = false;
var gameID = sessionStorage.getItem('gameID');

var endpoint = "ws://"+document.location.host+"/GameProject/lobbier";
var websocket = new WebSocket(endpoint);

console.log(endpoint);

var chatbox = document.querySelector(".text_holder3");
var textarea = document.getElementById("textarea");

var highExplosiveResearch = "";
var rounds = 0;
var timer = 0;
var points = 0;
var playerList = [];
var scoreList = [];

var start = false;
var wordlist = [];
var timerInterval;


/*
 * Creates the grid of squares used to as the Wordle grid
 * @param none
 * @returns {undefined}
 */
function createSquares() {
    const gameBoard = document.getElementById("board");

    for (let index = 0; index < 30; index++) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.classList.add("animate__animated");
        square.setAttribute("id", index + 1);
        gameBoard.appendChild(square);
    }
}

/*
 * A function that converts a JSONObject to a JSONString to send via the websocket
 * @param the packet JSONObject to send
 * @returns {undefined}
 */
function send(obj) {
    websocket.send(JSON.stringify(obj));
}

/*
 * The onload function used for initial setup
 * It is used to ensure eveery component on the DOM has loaded
 * @returns {undefined}
 */
window.onload = function() {
    document.querySelector(".options").style.visibility = "hidden";
    
    if(host !== null){
        isHost = true;
        document.querySelector(".options").style.visibility = "visible";
    }
    
    document.getElementById("gameIDinsert").innerHTML = ("GameID: " + gameID);
    document.querySelector(".text_holder1").innerHTML = (isHost ? host : guest);
    
    createSquares();
    document.querySelector(".mainbox").style.visibility = "Visible";
    document.querySelector(".Nextpage").style.visibility = "Hidden";
    
    let packet = {
        event : (isHost ? "lobbyStart" : "lobbyJoin"),
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    if(reloadBuffer == null){
        websocket.onopen = () => send(packet);
        sessionStorage.setItem('intialConnect', true);
    }
    
    console.log("All session storages " + host + " " + guest + " " + isHost + " " + gameID);
};


/*
 * Response function used to redirecrt the event to the correct handling function
 * @param the event object from the server websocket
 * @returns {undefined}
 */
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
    else if (message["event"] === "receiveWords")
        receiveWordList(message);
    else if (message["event"] === "lobbyWinners")
        updateResults(message);
    /*
    else if (message["event"] === "timerStart")
        timerUpdate(message);
    */
};


// Event listeners attached to various action buttons in the program
document.getElementById("chatBroadcast").addEventListener("click", postMessage);
document.getElementById("starter").addEventListener("click", gameStart);
document.querySelector(".submit").addEventListener("click", addGuess);

function timerUpdate(obj){
    timerValue = obj["message"]
    //let stopwatch = document.querySelector(".timer");
    
    stopwatch.innerHTML = ` ${timerValue} seconds remaining`;
}


/*
 * Function used to post each chat message to the server for broadcasrting
 * @param none
 * @returns {undefined}
 */
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

/*
 * A function that redirects to the initial page in the event of a lobby error on
 * the server
 * @param the JSONObject packet from the server
 * @returns {undefined}
 */
function lobbyFailure(obj){
    alert(obj["message"]);
    var redirect = obj["redirect"]; 
    window.location.replace(redirect);
}

/*
 * Handler function for when a player joins, used to 
 * @param none
 * @returns {undefined}
 */
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
        rounds : (document.getElementById("sections2")).value,
        time : (document.getElementById("sections")).value
    };
    
    send(packet);
    
    //sessionStorage.setItem('max_time', (document.getElementById("sections")).value);
    //sessionStorage.setItem('rounds', (document.getElementById("sections2")).value);
}

function gameStartReact(obj){
    
    sessionStorage.setItem('max_time', obj["rounds"]);
    sessionStorage.setItem('rounds', obj["time"]);
    
    document.querySelector(".mainbox").style.visibility = "Hidden";
    document.querySelector(".Nextpage").style.visibility = "Visible";
    
    rounds = obj["rounds"];
    timer = obj["time"];
    
    getWordList();
}

function getWordList(){
    console.log("Running and getting words");
    let packet = {
        event : "receiveWords",
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    send(packet);
}

var crounds = 1;
var tnew_timer = 0;
function timerStart(){
    console.log((parseInt(rounds)+1));
    if(tnew_timer === 0){
        crounds += 1;
        if(parseInt(crounds) >= (parseInt(rounds)+1) ){
            endGame();
            clearInterval(timerInterval);
            return;
        }
        
        console.log("End of Round");
        tnew_timer = timer;
    }
    
    console.log(tnew_timer + " " +timer);
    tnew_timer -= 1;
    
    let roundwatch = document.querySelector(".rounds");
    let stopwatch = document.querySelector(".timer");
    
    roundwatch.innerHTML = `Round: ${crounds} / ${rounds}`;
    stopwatch.innerHTML = ` ${tnew_timer} seconds remaining`;
}

function receiveWordList(obj){
    wordlist = JSON.parse(obj["message"]);
    console.log(wordlist);
    
    displayAllWords();
    getNewWord();
    console.log("Answer: " + highExplosiveResearch);
    
    tnew_timer = timer;
    
    timerInterval = setInterval(timerStart, 1000);
    console.log(tnew_timer, timer);
}

function displayAllWords(){
    let tempAnswers = document.createElement("div");
    tempAnswers.classList.add("answers");
    
    for (let i=0; i<wordlist.length; i++){
        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = wordlist[i];
        tempDiv.classList.add("answerWord");
        
        tempAnswers.appendChild(tempDiv);
    }
    document.body.appendChild(tempAnswers);
    setTimeout(function(){document.body.removeChild(tempAnswers)} , 4000);
    
    
    let packet = {
        event : "timerStart",
        sender : (isHost ? host : guest),
        game : (""+gameID),
        time : timer
    };
    
    send(packet);
}

function getNewWord() {
    highExplosiveResearch = wordlist[Math.floor(Math.random() * wordlist.length)];
    highExplosiveResearch = highExplosiveResearch.toUpperCase();
}

var row = 0;
function addGuess(){
    let scorewatch = document.querySelector(".score");
    let guess = document.getElementById("inputGuess");
    let evaluations = 0;
    
    if(guess.value === "" || guess.value.length < 5 ){
        alert("Enter a 5 letter word!");
        return;
    }
    
    let word = (guess.value).toUpperCase();
    
    // Evalusations part
    for (let i=0; i<5; i++){
        let index = ((row*5)+(i+1)).toString();
        let tempTile = document.getElementById(index);
        
        if(tempTile === null){
            console.log("Ending the round due to lack of space");
            endRound();
            row = 0;
            break;
        }
        
        if(word.charAt(i) === highExplosiveResearch.charAt(i)){    
            tempTile.classList.add("correct");
            tempTile.innerHTML = word.charAt(i);
            points+=20;
            console.log("Same: " + index);
            evaluations += 1;
            
            if(evaluations >= 5){
                console.log("All correct");
                row = 0;
                points += (5*tnew_timer);
                scorewatch.innerHTML = `${points} points`;
                
                setTimeout(endRound, 3000);
                return;
            }
        }
        
        else if(highExplosiveResearch.includes(word.charAt(i))){
            tempTile.classList.add("halfWay");
            tempTile.innerHTML = word.charAt(i);
            points+=10;
            console.log("Similar: " + index);
        }
        
        else{
            tempTile.classList.add("wrong");
            tempTile.innerHTML = word.charAt(i);
            console.log("Not same: " + index);
        }
        
        scorewatch.innerHTML = `${points} points`;
        
    }
    
    row+=1;
}

function endRound(){
    console.log("Ending of round triggered");
    
    // When round ends at the end of a timer
    if( parseInt(crounds) >= (parseInt(rounds)+1) ){
        console.log("Time ending");
        clearInterval(timerInterval);
        endGame();
        return;
    }
    
    // Round ends due to correct word
    else if (parseInt(crounds) === (parseInt(rounds))) {
        console.log("All correct ending");
        clearInterval(timerInterval);
        endGame();
        return;
    }
    
    // Normal round end with no correct answer move on to next round if exists
    else {
        crounds += 1;
        setTimeout(function () {tnew_timer = timer;}, 2000);
    }
    
    highExplosiveResearch = wordlist[Math.floor(Math.random() * wordlist.length)];
    tnew_timer = timer;
    
    for (let index = 0; index < 30; index++) {
        console.log("Index: " + (index+1).toString());
        let tile = document.getElementById( (index+1).toString() );
        tile.innerHTML = "";
        tile.removeAttribute("class");
        tile.classList.add("square");
        tile.classList.add("animate__animated"); 
    }
}

function endGame(){
    console.log("Ending of game triggered");
    let packet = {
        event : "endGame",
        sender : (isHost ? host : guest),
        game : (""+gameID),
        score : points
    };
    
    send(packet);
    
    setTimeout( function(){
        document.querySelector(".mainbox").style.visibility = "Visible";
        document.querySelector(".Nextpage").style.visibility = "Hidden";
    }, 3000);
}

function updateResults(obj){
    let results = "1st Place  " + obj["message"];
    document.querySelector(".text_holder2").innerHTML = results;
}