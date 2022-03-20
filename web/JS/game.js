/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


//var endpointGame = "ws://"+document.location.host+"/GameProject/game";

var endpoint = "ws://"+document.location.host+"/GameProject/lobbier";
var websocketNew = new WebSocket(endpoint);

console.log(endpoint);

var highExplosiveResearch = "";

var host = sessionStorage.getItem('hostUsername2');
var guest = sessionStorage.getItem('username2');
var isHost = false;
var gameID = sessionStorage.getItem('gameID2');

var rounds = sessionStorage.getItem('rounds');
var timer = sessionStorage.getItem('max_time');

var start = false;
var wordlist = [];

function send(obj) {
    console.log("Send function working");
    console.log(obj);
    websocketNew.send(JSON.stringify(obj));
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
    console.log("Running and getting words");
    let packet = {
        event : "receiveWords",
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
    currentword = wordlist[Math.floor(Math.random() * wordlist.length)];
}


/*
    Client: Start Game
    Server: Send words
    Client: Show words for 3 seconds
    Client: Start timer
    Client: End timer
    Client: Give point and round details
    Client: Next round
*/

window.onload = function() {
    console.log("Working")
    createSquares();
    
    if(host != null)
        isHost = true;
    
    console.log("All session storages " + host + " " + guest + " " + isHost + " " + gameID + " " + rounds + " " + timer);
    websocketNew.onopen = () => getWordList();
    
    getNewWord();
    
    setTimeout(timerStart , 5000);
    
    
};