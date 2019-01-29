// Express
const express = require('express')
const app = express()
const server = require('http').Server(app)

// Socket.io
const io = require('socket.io')(server)

// Socket.io is used for signalling before the webrtc connection is set-up
io.on('connection', (socket) => {
  // Respond to client request to join a room
  socket.on('join', room => {
    socket.join(room)
  })

  // Respond to client request to send webrtc answer to room
  socket.on('answer', (data) => {
    io.to(data.room).emit('answer', data.answer)
  })
})

const serverPort = process.env.PORT || 10000

app.use(express.static('public'))

server.listen(serverPort, () => {
  app.emit('started')
  console.log(`Started server on port ${serverPort}`)
})
