/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var endpointGame = "ws://"+document.location.host+"/GameProject/game";
var websocketNew = new WebSocket(endpointGame);

var highExplosiveResearch = "";

var host = sessionStorage.getItem('hostUsername');
var guest = sessionStorage.getItem('username');
var isHost = false;
var gameID = sessionStorage.getItem('gameID');

var rounds = sessionStorage.getItem('rounds');
var timer = sessionStorage.getItem('max_time');

var start = False;
var wordlist = [];


/*
    Client: Start Game
    Server: Send words
    Client: Show words for 3 seconds
    Client: Start timer
    Client: End timer
    Client: Give point and round details
    Client: Next round
*/

function send(obj, websocket) {
    websocket.send(JSON.stringify(obj));
}

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

start.addEventListener("change", function(){
    setInterval(timerStart, 1000, timer);
});

function getCurrentWordArr() {
    const numberOfGuessedWords = guessedWords.length;
    return guessedWords[numberOfGuessedWords - 1];
}

function updateGuessedWords(letter) {
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr && currentWordArr.length < 5) {
        currentWordArr.push(letter);

        const availableSpaceEl = document.getElementById(String(availableSpace));

        availableSpace = availableSpace + 1;
        availableSpaceEl.textContent = letter;
    }
}

function getTileColor(letter, index) {
    const isCorrectLetter = word.includes(letter);

    if (!isCorrectLetter) {
        return "rgb(58, 58, 60)";
    }

    const letterInThatPosition = word.charAt(index);
    const isCorrectPosition = letter === letterInThatPosition;

    if (isCorrectPosition) {
        return "rgb(83, 141, 78)";
    }
    return "rgb(181, 159, 59)";
}

function handleSubmitWord() {
    
}

var tnew_timer = timer;
function timerStart(){
    tnew_timer -= 1;
    console.log(tnew_timer + " " + timer);
    
    let elem = document.querySelector(".timer");
    elem.innerHTML = ` ${tnew_timer} seconds`;
}


function getWordList(){
    let packet = {
        event : "roundStart",
        sender : (isHost ? host : guest),
        game : (""+gameID)
    };
    
    send(packet);
}

function displayAllWords(){
    let tempAnswers = document.createElement("div");
    tempAnswers.classList.add("answers");
    
    for (let i=0; i<wordlist.length; i++){
        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = wordlist[i];
        tempDiv.classList.add("answerWord");
        
        answers.innerHTML += tempDiv;
    }
    
    setTimeout(function(){} , 5000);
    tempAnswers.remove();
}


function receiveWordList(obj){
    wordlist = obj["words"];
}

function getNewWord() {
    currentword = wordlist[Math.floor(Math.random() * array.length)];
}


window.onload = function() {
    createSquares();
    
    if(host != null)
        isHost = true;
    
    websocketNew.onopen = getWordList();
    
    getNewWord();
    
    setTimeout(timerStart , 5000);
    
    
};