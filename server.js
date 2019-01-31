// Express
const express = require('express')
const app = express()
const server = require('http').Server(app)

// Socket.io
const io = require('socket.io')(server)

// Twillo (for STUN and TURN)
let twilio = require('twilio')(process.env.TWILIO_ACCOUNT_ID, process.env.TWILIO_AUTH_TOKEN)

async function getIce () {
  let token = await twilio.tokens.create({ttl: 600})
  // Twilio returns an array of ice servers but the key for the url is 'url'
  // This is deprecated and doesn't work in mobile safari
  // change the keys: url => urls
  return token.iceServers.map(i => {
    i['urls'] = i['url']
    delete i['url']
    return i
  })
}

// Socket.io is used for signalling before the webrtc connection is set-up
io.on('connection', (socket) => {
  // Respond to client request to join a room
  socket.on('join', room => {
    socket.join(room)
  })

  // Respond to client request to fetch offer
  socket.on('getOffer', async (data) => {
    let iceServers = await getIce()
    io.to(data.room).emit('getOffer', {iceServers})
  })

  // Respond to client request to send offer
  socket.on('offer', async (data) => {
    let iceServers = await getIce()
    io.to(data.room).emit('offer', {offer: data.offer, iceServers})
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
