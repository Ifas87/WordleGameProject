/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

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

var chatbox = document.querySelector(".text_holder3");
var textarea = document.getElementById("textarea");

var highExplosiveResearch = "";
var rounds = 0;
var timer = 0;
var points = 0;
var playerList = [];
var scoreList = [];

var start = true;
var end = false;
var update = true;
var guessesPossible = true;
var wordlist = [];


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
    
    //xconsole.log("All session storages " + host + " " + guest + " " + isHost + " " + gameID);
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
    else if (message["event"] === "timerUpdate")
        timerUpdate(message);
};


// Event listeners attached to various action buttons in the program
document.getElementById("chatBroadcast").addEventListener("click", postMessage);
document.getElementById("starter").addEventListener("click", gameStart);
document.querySelector(".submit").addEventListener("click", addGuess);


var crounds = 1;
var tnew_timer = timer;

function timerUpdate(obj){
    
    timerValue = obj["message"]
    tnew_timer = parseInt(timerValue);
    
    if(tnew_timer <= 0){
        console.log((isHost ? host : guest) +" Values: " + (tnew_timer <= 0) + " " + (timerValue <= 0) + " " + crounds + " " + tnew_timer + " " + timerValue)
        crounds += 1;
        
        if( (parseInt(crounds) >= (parseInt(rounds)+1)) && end ){
            end = false;
            guessesPossible = true;
            (document.querySelector(".info")).innerHTML = "";
            (document.querySelector(".score")).innerHTML = "";
            (document.querySelector(".rounds")).innerHTML = "";
            (document.querySelector(".timer")).innerHTML = "";
            start = true;
            crounds = 1;
            tnew_timer = timer;
            score = 0;

            endGame();
            return;
        }
        
        for (let index = 0; index < 30; index++) {
            let tile = document.getElementById( (index+1).toString() );
            tile.innerHTML = "";
            tile.removeAttribute("class");
            tile.classList.add("square");
            tile.classList.add("animate__animated"); 
        }
        
        console.log((isHost ? host : guest)+" Are you a host? " + isHost);
        guessesPossible = true;
        (document.querySelector(".info")).innerHTML = "";
        (document.querySelector(".score")).innerHTML = "";
        (document.querySelector(".rounds")).innerHTML = "";
        (document.querySelector(".timer")).innerHTML = "";
        start = true;
        score = 0;
        tnew_timer = timer;
        
        highExplosiveResearch = wordlist[Math.floor(Math.random() * wordlist.length)];
        highExplosiveResearch = highExplosiveResearch.toUpperCase();
        console.log("Answer: " + highExplosiveResearch);
        
        debouncing();
        /*
        let packet = {
            event : "timerUpdate",
            sender : (isHost ? host : guest),
            game : (""+gameID),
            time : timer
        };
        if (isHost === true){
            send(packet);
        }
        */
    }
    let roundwatch = document.querySelector(".rounds");
    roundwatch.innerHTML = `Round: ${crounds} / ${rounds}`;
    
    let stopwatch = document.querySelector(".timer");
    stopwatch.innerHTML = ` ${timerValue} seconds remaining`;
}


/*
 * Function used to post each chat message to the server for broadcasrting
 * @param none
 * @returns {undefined}
 */
function postMessage(){
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
    let packet = {
        event : "receiveWords",
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    send(packet);
}

function receiveWordList(obj){
    wordlist = JSON.parse(obj["message"]);
    console.log(wordlist);
    
    displayAllWords();
    getNewWord();
    console.log("Answer: " + highExplosiveResearch);
}

function debouncing(){
    if (start === true){
        let packet = {
                event : "timerUpdate",
                sender : (isHost ? host : guest),
                game : (""+gameID),
                time : timer
        };

        if (isHost){
            console.log((isHost ? host : guest) + " Package sent")
            send(packet);
        }
        start = false;
    }
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
    var tryTimeout = setTimeout(function(){
        document.body.removeChild(tempAnswers);
        end = true;
        
        debouncing();
        clearTimeout(tryTimeout);
    } , 4000);
    
    tnew_timer = timer;
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
    
    if (guessesPossible === true) {
        // Evalusations part
        for (let i=0; i<5; i++){
            let index = ((row*5)+(i+1)).toString();
            let tempTile = document.getElementById(index);

            if(tempTile === null){
                console.log("Ending the round due to lack of space");
                row = 0;
                break;
            }

            if(word.charAt(i) === highExplosiveResearch.charAt(i)){    
                tempTile.classList.add("correct");
                tempTile.innerHTML = word.charAt(i);
                points+=20;
                evaluations += 1;

                if(evaluations >= 5){
                    console.log("All correct");
                    row = 0;
                    if(tnew_timer >= timer/2){
                        points += (10*tnew_timer);
                    }
                    else {
                        points += (5*tnew_timer);
                    }
                    scorewatch.innerHTML = `${points} points`;
                    guessesPossible = false;
                    (document.querySelector(".info")).innerHTML = "Waiting for other players to complete";
                    return;
                }
            }

            else if(highExplosiveResearch.includes(word.charAt(i))){
                tempTile.classList.add("halfWay");
                tempTile.innerHTML = word.charAt(i);
                points+=10;
            }

            else{
                tempTile.classList.add("wrong");
                tempTile.innerHTML = word.charAt(i);
            }

            scorewatch.innerHTML = `${points} points`;
        }
        row+=1;
    }
}

function endRound(){
    
}

function endGame(){
    console.log("Ending of game triggered");
    
    for (let index = 0; index < 30; index++) {
        let tile = document.getElementById( (index+1).toString() );
        tile.innerHTML = "";
        tile.removeAttribute("class");
        tile.classList.add("square");
        tile.classList.add("animate__animated"); 
    }
    
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