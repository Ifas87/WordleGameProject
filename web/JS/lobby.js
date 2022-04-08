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
var baselink = "";

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
    
    // Initial phase of joining the game used to authenticate users into the game 
    let packet = {
        event : (isHost ? "lobbyStart" : "lobbyJoin"),
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    // Used to deal with website reloading to avoid multiple lobbyStart or LobbyJoin events at once
    if(reloadBuffer === null){
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
    // The message received from the server
    let message = JSON.parse(evt.data);
    
    // Event for the wrong gameID or too many players
    if (message["event"] === "incorrectLobby")
        lobbyFailure(message);
    // LobbyJoin event used to display the other usernames
    else if (message["event"] === "playerJoin")
        playerJoin(message, message["guest"]);
    // Chat event used to receive messages
    else if (message["event"] === "chatMessage")
        receiveMessage(message);
    // Game start react event to switch pages
    else if (message["event"] === "gameStart")
        gameStartReact(message);
    // Receiving the words for the game
    else if (message["event"] === "receiveWords")
        receiveWordList(message);
    // Event for printing the 1st place winners
    else if (message["event"] === "lobbyWinners")
        updateResults(message);
    // Event for updating and printing the timer
    else if (message["event"] === "timerUpdate")
        timerUpdate(message);
    // Event for players leaving
    else if (message["event"] === "playerLeaving")
        removePlayer(message);
};


// Event listeners attached to various action buttons in the program
document.getElementById("chatBroadcast").addEventListener("click", postMessage);
document.getElementById("starter").addEventListener("click", gameStart);
document.querySelector(".submit").addEventListener("click", addGuess);


/*
 * The removePlayer function removes the player name from playerlist
 * @param the event object from the server websocket
 * @returns none
 */
function removePlayer(obj){
    let tempStr = document.querySelector(".text_holder1").innerHTML;
    document.querySelector(".text_holder1").innerHTML = tempStr.replace("<br>"+obj["message"], " ");
    console.log(document.querySelector(".text_holder1").innerHTML);
}


/*
 * The timerUpdate function triggered in response to the server's timer response
 * It handles the game state as well, switching rounds and managing the win conditions
 * @param the event object from the server websocket
 * @returns none
 */

// Tracker global variables for round and timer
var crounds = 1;
var tnew_timer = timer;

function timerUpdate(obj){
    // Getting the timer value from the object
    timerValue = obj["message"]
    tnew_timer = parseInt(timerValue);
    
    // Used to play custom audio to "motivate" the player
    if (tnew_timer === 12){
            var audio = new Audio(baselink+'panic.mp3');
            audio.play();
    }
    
    // Round or game end condition applied when the timer runs out
    if(tnew_timer <= 0){
        //console.log((isHost ? host : guest) +" Values: " + (tnew_timer <= 0) + " " + (timerValue <= 0) + " " + crounds + " " + tnew_timer + " " + timerValue)
        // Incrementing the round number
        crounds += 1;
        
        // Checking if all the rounds have ended, if yes reset everything and trigger the game end for results
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

            endGame();
            return;
        }
        
        // Clearing the game board by removing classes
        for (let index = 0; index < 30; index++) {
            let tile = document.getElementById( (index+1).toString() );
            tile.innerHTML = "";
            tile.removeAttribute("class");
            tile.classList.add("square");
            tile.classList.add("animate__animated"); 
        }
        
        //console.log((isHost ? host : guest)+" Are you a host? " + isHost);
        // Restting all game variables (except rounds) for the next round
        guessesPossible = true;
        (document.querySelector(".info")).innerHTML = "";
        (document.querySelector(".score")).innerHTML = "";
        (document.querySelector(".rounds")).innerHTML = "";
        (document.querySelector(".timer")).innerHTML = "";
        start = true;
        tnew_timer = timer;
        
        // Rechoosing a new word for the next round
        highExplosiveResearch = wordlist[Math.floor(Math.random() * wordlist.length)];
        highExplosiveResearch = highExplosiveResearch.toUpperCase();
        console.log("Answer: " + highExplosiveResearch);
        
        debouncing();
    }
    // In the event that the timer is not 0 the rounds and timer values are displayed
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
 * Handler function for when a player joins, used to print their name in the player list
 * @param none
 * @returns {undefined}
 */
function playerJoin(obj, str){
    let current = document.querySelector(".text_holder1").innerHTML;
    if (!current.includes(str))
        document.querySelector(".text_holder1").innerHTML += `<br>${str}`;
}

/*
 * Handler function for when a new chat message is sent , used to print the messages into chat 
 * @param none
 * @returns {undefined}
 */
function receiveMessage(obj){
    let str = obj["message"];
    
    document.querySelector(".text_holder3").innerHTML += `<br>${str}`;
}

/*
 * Handler function for when the host starts the game, used to provide round and time details to every guest 
 * @param none
 * @returns {undefined}
 */
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

/*
 * Handler function for when a player joins, used to save round and timer values
 * and change pages to game 
 * @param websocket data JSONobject
 * @returns {undefined}
 */
function gameStartReact(obj){
    
    sessionStorage.setItem('max_time', obj["rounds"]);
    sessionStorage.setItem('rounds', obj["time"]);
    
    document.querySelector(".mainbox").style.visibility = "Hidden";
    document.querySelector(".Nextpage").style.visibility = "Visible";
    
    baselink = obj["baselink"]
    rounds = obj["rounds"];
    timer = obj["time"];
    
    getWordList();
}

/*
 * Function used at the start of the game to get the 20 word array
 * @param none
 * @returns {undefined}
 */
function getWordList(){
    let packet = {
        event : "receiveWords",
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    send(packet);
}

/*
 * Handler function for when the wordlist is received, it saves this wordlist
 * and triggers the display page and selects a new answer 
 * @param none
 * @returns {undefined}
 */
function receiveWordList(obj){
    wordlist = JSON.parse(obj["message"]);
    console.log(wordlist);
    
    displayAllWords();
    getNewWord();
    console.log("Answer: " + highExplosiveResearch);
}

/*
 * A workaround function used to handle the bugged setInterval and setTimeout functions
 * Ensures that the timerUpdate call is only done once to avoid a breakdown of the game 
 * @param none
 * @returns {undefined}
 */
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

/*
 * Function used to display all the words of the array into the answers page
 * in a grid layout 
 * @param none
 * @returns {undefined}
 */
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
    
    // Set timeout to remove the answers page and start the timer after 4 pages
    var tryTimeout = setTimeout(function(){
        document.body.removeChild(tempAnswers);
        end = true;
        
        debouncing();
        clearTimeout(tryTimeout);
    } , 4000);
    
    tnew_timer = timer;
}

/*
 * Function to get a random word from the wordlist and make it capitalised for
 * crosschecking 
 * @param none
 * @returns {undefined}
 */
function getNewWord() {
    highExplosiveResearch = wordlist[Math.floor(Math.random() * wordlist.length)];
    highExplosiveResearch = highExplosiveResearch.toUpperCase();
}

/*
 * A complicated function that crosschecks the both the user's guess and the answers letter
 * by letter to find the write and wrong letters.
 * @param none
 * @returns {undefined}
 */
var row = 0;
function addGuess(){
    // Variables to update the score and get guessed words
    let scorewatch = document.querySelector(".score");
    let guess = document.getElementById("inputGuess");
    let evaluations = 0;
    
    // Input validation to ensure a 5 letter word
    if(guess.value === "" || guess.value.length < 5 ){
        alert("Enter a 5 letter word!");
        return;
    }
    // conversion to upper case for easier crosschecking
    let word = (guess.value).toUpperCase();
    
    // Variable used to enable and disable checking
    if (guessesPossible === true) {
        console.log("row is: "+row);
        // Evalusations part
        for (let i=0; i<5; i++){
            // The current tile to write letter to
            let index = ((row*5)+(i+1)).toString();
            let tempTile = document.getElementById(index);
            
            // Check if all tiles are used
            if(tempTile === null || index > 30){
                console.log("Ending the round due to lack of space");
                row = 0;
                guessesPossible = false;
                (document.querySelector(".info")).innerHTML = "Waiting for other players to complete";
                break;
            }
            
            // Evaluation for correct tiles
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
            
            // Evaluation for improper or misplaced letters
            else if(highExplosiveResearch.includes(word.charAt(i))){
                tempTile.classList.add("halfWay");
                tempTile.innerHTML = word.charAt(i);
                points+=10;
            }
            
            // Evalutation for wrong letters
            else{
                tempTile.classList.add("wrong");
                tempTile.innerHTML = word.charAt(i);
            }

            scorewatch.innerHTML = `${points} points`;
        }
        // Move to next rows
        row+=1;
        
        if( row >= 6){
            row=0;
        }
    }
}

/*
 * A complicated function that resets the board and all variables similar to the endround 
 * function but also send the points for evaluation and results
 * @param none
 * @returns {undefined}
 */
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
    
    points=0;
    
    setTimeout( function(){
        document.querySelector(".mainbox").style.visibility = "Visible";
        document.querySelector(".Nextpage").style.visibility = "Hidden";
    }, 3000);
}

/*
 * The function used to print out the results and the winner to the screen
 * @param the web socket object with winner information
 * @returns {undefined}
 */
function updateResults(obj){
    let results = "1st Place  " + obj["message"];
    document.querySelector(".text_holder2").innerHTML = results;
}