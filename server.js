// Express
const express = require('express')
const app = express()
const server = require('http').Server(app)

// Socket.io
const io = require('socket.io')(server)

io.on('connection', (socket) => {
  socket.on('join', room => {
    socket.join(room)
  })

  socket.on('answer', (data) => {
    io.to(data.room).emit('answer', data.answer)
  })
})
// const p2p = require('socket.io-p2p-server').Server
// io.use(p2p)

// io.on('connection', (socket) => {
//   console.log('socket id:', socket.id)
// })

// io.on('connection', function (socket) {
//   socket.on('peer-msg', function (data) {
//     console.log('Message from peer: %s', data)
//     socket.broadcast.emit('peer-msg', data)
//   })

//   socket.on('peer-file', function (data) {
//     console.log('File from peer: %s', data)
//     socket.broadcast.emit('peer-file', data)
//   })

//   socket.on('go-private', function (data) {
//     socket.broadcast.emit('go-private', data)
//   })
// })

const serverPort = process.env.PORT || 10000

app.use(express.static('public'))

server.listen(serverPort, () => {
  app.emit('started')
  console.log(`Started server on port ${serverPort}`)
})
