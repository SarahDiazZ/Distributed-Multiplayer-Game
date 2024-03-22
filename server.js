const express=require("express")
const app=express()

const path=require("path")
const http=require("http")
const {Server}=require("socket.io")

const server=http.createServer(app)

const io=new Server(server)
app.use(express.static("public"))

let arr = []
let playingArr = []

io.on("connection", (socket) =>{
    console.log("User connected")
    socket.on("find",(e)=> {
        if (e.name != null) {
            arr.push(e.name)

            if (arr.length >= 2) {
                let p1obj = {
                    p1name:arr[0], //adds player 1 name into array
                    p1value:"Red",
                    p1move:""
                }

                let p2obj= {
                    p2name:arr[1], //adds player 1 name into array
                    p2value:"Yellow",
                    p2move:""
                }

                let obj={
                    p1:p1obj,
                    p2:p2obj,
                    sum:1
                }

                playingArr.push(obj)

                //after connecting two players, erase them from array
                arr.splice(0, 2)

                io.emit("find", {
                    allPlayers:playingArr
                })
            }
        }
    })

    socket.on("setChip", (e)=> {
        const {tile, curPlayer, name, row} = e;
        // console.log( "player " + curPlayer + " (" + name + ")"+ " has occupied tile " + tile );
        
        if (e.curPlayer == "R") {
            let objToChange = playingArr.find(obj => obj.p1.p1name === e.name)

            objToChange.p1.p1move = e.tile
            objToChange.sum++
        }
        
        else if (e.curPlayer == "Y") {
            let objToChange = playingArr.find(obj => obj.p2.p2name === e.name)

            objToChange.p2.p2move = e.tile
            objToChange.sum++
        }
        else {
            console.log("NOT UR TURN")
        }
        console.log("Emitting chip")
        io.emit("setChip", {
            allPlayers:playingArr,
            curPlayer: e.curPlayer,
            board: e.board,
            row: e.row,
            curCols: e.curCols
        })
    })

    socket.on("winner", winner => {
        io.emit('displayWinner', winner);
    });

})

app.get("/", (req, res)=>{
    return res.sendFile("index.html") //sends the html to start the page
})

server.listen(3000, ()=>{
    console.log("Connected to port 3000")
})