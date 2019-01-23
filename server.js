// Express
const express = require('express')
const app = express()
const server = require('http').Server(app)

// Socket.io
const io = require('socket.io')(server)
const p2p = require('socket.io-p2p-server').Server
io.use(p2p)

io.on('connection', function(socket){
  console.log(socket.id)
})

const serverPort = process.env.PORT || 10000

app.use(express.static('public'))

server.listen(serverPort, () => {
  app.emit('started')
  console.log(`Started server on port ${serverPort}`)
})
