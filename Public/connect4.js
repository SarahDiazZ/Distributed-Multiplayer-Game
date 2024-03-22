'use strict'
const socket = io("http://localhost:3000");



var pRed = "R";
var pYellow = "Y";
var curPlayer = pRed; //Makes player red go first

var gameOver = false;
var board;
var curCols;

//Controls the number of rows and columns on the board
var rows = 6;
var cols = 7;

//When the page loads
window.onload = function() {
    setGame();
    document.getElementById("board").style.display="none"
    document.getElementById("userCont").style.display="none"
    document.getElementById("oppNameCont").style.display="none"
    document.getElementById("valueCont").style.display="none"
    document.getElementById("whosTurn").style.display="none"
    document.getElementById("restartBtn").style.display="none"
    let restart = document.getElementById("restartBtn").addEventListener("click", restartGame);

    let name;

    document.getElementById("find").addEventListener("click", function(){
        name = document.getElementById("name").value

        document.getElementById("user").innerText=name

        if(name == null || name=='') {
            alert("Enter a name!")
        }

        else {
            socket.emit("find", {name:name}) //passes the name of the user to the backend
            document.getElementById("find").disabled=true
        }
    })
}

let clientPlayer

socket.on("find", (e)=>{
    let allPlayersArr = e.allPlayers

    document.getElementById("board").style.display="flex"
    document.getElementById("userCont").style.display="block"
    document.getElementById("oppNameCont").style.display="block"
    document.getElementById("valueCont").style.display="block"
    document.getElementById("name").style.display="none"
    document.getElementById("find").style.display="none"
    document.getElementById("whosTurn").style.display="block"
    document.getElementById("whosTurn").innerText="Red's Turn"
    document.getElementById("restartBtn").style.display="flex"
    document.getElementById("enterName").style.display="none"

    let oppName
    let colorValue
    let name 
    name = document.getElementById("name").value

    const foundObj = allPlayersArr.find(obj=>obj.p1.p1name == `${name}` || obj.p2.p2name == `${name}`)

    if (foundObj.p1.p1name == `${name}`) {
        oppName = foundObj.p2.p2name;
        colorValue = foundObj.p1.p1value
        clientPlayer = pRed
    }

    else {
        oppName = foundObj.p1.p1name
        colorValue = foundObj.p2.p2value;
        clientPlayer = pYellow
    }

    //Opponent name
    document.getElementById("oppName").innerText=oppName

    //user color
    document.getElementById("colorValue").innerText=colorValue

})

function setGame() {
    board = []
    curCols = [5, 5, 5, 5, 5, 5, 5];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push(' ');

            //html
            //<div id="0-0" class="tile">
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.addEventListener("click", setChip);
            document.getElementById("board").append(tile);
        }
        board.push(row);
    }
}

//Adds the chips onto the board when user clicks
function setChip() {
    if (gameOver) {
        return;
    }
    
    if (clientPlayer != curPlayer) {
        return;
    }

    let coor = this.id.split("-"); //"0-0" --> ["0", "0"]
    let r = parseInt(coor[0]);
    let c = parseInt(coor[1]);

    r = curCols[c];
    if (r < 0) {
        return;
    }

    board[r][c] = curPlayer;
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    tile.classList.add("falling", "rotating");

    if (curPlayer == pRed) {
        tile.classList.add("red-chip");
        // curPlayer = pYellow; //Makes chip alternate
    }
    else {
        tile.classList.add("yellow-chip");
        // curPlayer = pRed;
    }
    tile.addEventListener("animation_end", function() {
        tile.classList.remove("falling", "rotating");
    }, {once: true});

    r -= 1; //Updates the row height for the column
    curCols[c] = r; //Update the array

    let name;
    name = document.getElementById("name").value;

    socket.emit("setChip", {
        tile: tile.id, //might change back to tile.id
        curPlayer: curPlayer,
        name: name,
        board, board,
        row: r,
        curCols: curCols
    })

    checkWinner();

} //end setChip



socket.on("setChip", (e) => {
    let name;
    name = document.getElementById("name").value;
    
    const currentPlay = e.curPlayer;
    const foundObj= (e.allPlayers).find(obj => obj.p1.p1name == `${name}` || obj.p2.p2name == `${name}`);

    let p1id = foundObj.p1.p1move;
    let p2id = foundObj.p2.p2move;

    //switches players turns
    if ((foundObj.sum) % 2 == 0) { //player 2 turn
        document.getElementById("whosTurn").innerText = "Yellow's Turn"
    }
    else { //player 1 turn
        document.getElementById("whosTurn").innerText = "Red's Turn"
    }

    if (p1id != '') {
        document.getElementById(`${p1id}`).classList.add("red-chip")
        // document.getElementById(`${p1id}`).disabled = true
    }
    if (p2id != '') {
        document.getElementById(`${p2id}`).classList.add("yellow-chip")
        document.getElementById(`${p2id}`).disabled = true
    }

    if (currentPlay == pRed) {
        curPlayer = pYellow
    }
    if (currentPlay == pYellow) {
        curPlayer = pRed
    }

    board = e.board
    curCols = e.curCols
})

function checkWinner() {
    //horizontal
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 3; c++) { //checks 3 ahead of us before going out of bounds
            if (board[r][c] != ' ') { //checks if board has a chip
                if (board[r][c] == board[r][c+1] && board[r][c+1] == board[r][c+2] && board[r][c+2] == board[r][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    //vertical
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 3; r++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c] && board[r+1][c] == board[r+2][c] && board[r+2][c] == board[r+3][c]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    //diagonal
    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < cols - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r+1][c+1] && board[r+1][c+1] == board[r+2][c+2] && board[r+2][c+2] == board[r+3][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

    for (let r = 3; r < rows; r++) {
        for (let c = 0; c < cols - 3; c++) {
            if (board[r][c] != ' ') {
                if (board[r][c] == board[r-1][c+1] && board[r-1][c+1] == board[r-2][c+2] && board[r-2][c+2] && board[r-2][c+2] == board[r-3][c+3]) {
                    setWinner(r, c);
                    return;
                }
            }
        }
    }

}

function setWinner(r, c) {
    let winner = document.getElementById("winner");

    

    //Displays text
    if (board[r][c] == pRed) {
        winner = "Red";
    }
    else {
        winner = "Yellow";
    }
    
    socket.emit("winner", winner);

    let restart = document.getElementById("restartBtn").addEventListener("click", restartGame);
    gameOver = true;

}

socket.on("displayWinner", winner => {
    let display = document.getElementById("winner");
    display.innerText = `${winner} Wins!`;
    gameOver = true;
})

function restartGame() {
    window.location.reload(); //Reloads the page
}