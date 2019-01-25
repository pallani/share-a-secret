function init () {
  console.log('window.location.hash:', window.location.hash, window.location.hash === '')

  let origin = window.location.origin

  let shareNowButton = $('#shareNowButton')
  let welcomeJumboTron = $('#welcomeJumboTron')
  let mainShareContainer = $('#mainShareContainer')
  let secretField = $('#secretField')
  let showHideButton = $('#showHideButton')

  let mainReceiveContainer = $('#mainReceiveContainer')
  let codeField = $('#codeField')
  let sendButton = $('#sendButton')
  let secretValue = $('#secretValue')

  let senderStatus = $('#senderStatus')

  window.room = window.uuid()
  window.otpSecret = window.uuid()

  if (window.location.hash === '') {
    welcomeJumboTron.removeClass('d-none')
  } else {
    let hash = JSON.parse(window.atob(window.location.hash.substring(1)))
    console.log('room:', hash.room)
    var p2 = new window.SimplePeer({ initiator: false, trickle: false })
    p2.on('signal', (data) => {
      console.log('answer:', data)
      window.socket2 = io.connect(origin)
      socket2.on('connect', (socket) => {
        socket2.emit('join', hash.room)
        socket2.emit('answer', { room: hash.room, answer: data})
      })
    })
    p2.signal(JSON.stringify(hash.offer))
    p2.on('data', function (data) {
      console.log('got a message from peer1: ' + data)
      mainReceiveContainer.removeClass('d-none')
      secretValue.text(''+data)
    })
  }

  shareNowButton.on('click', () => {
    welcomeJumboTron.addClass('d-none')
    mainShareContainer.removeClass('d-none')

    if (window.location.hash === '') {
      var p = new window.SimplePeer({ initiator: true, trickle: false })
      p.on('error', (err) => console.log('error', err))
      p.on('signal', (data) => {
        console.log('offer:', data)
        console.log('room:', window.room)
        let hash = {
          room: window.room,
          offer: data
        }
        window.location.hash = window.btoa(JSON.stringify(hash))
        window.socket1 = io.connect(origin)
        socket1.on('connect', (socket) => {
          socket1.emit('join', window.room)
          socket1.on('answer', (answer) => {
            console.log('signaling answer')
            p.signal(JSON.stringify(answer))
          })
        })
      })
      p.on('data', function (data) {
        if (window.currentTotp === '' + data) {
          p.send('Secret: ' + secretField.val().trim())
        } else {
          p.send("Incorrect Code!")
        }
        console.log('got a message from peer2: ' + data)
      })
      p.on('connect', function (data) {
        p.send('Call the person with secret and ask for the code!')
        senderStatus.text('Connected to receiver!')
        setInterval(() => {
          window.currentTotp = otplib.totp.generate(window.otpSecret)
          window.totpTimeLeft = otplib.totp.timeRemaining()
          $('#totpValue').text(`${window.currentTotp}  `)
          $('.progress-bar').css('width', `${Math.floor(( window.totpTimeLeft / 30) * 100)}%`)
        }, 1000)
      })
    }
  })

  showHideButton.on('click', (e) => {
    if (secretField.attr('type') === 'password') {
      secretField.attr('type', 'text')
    } else {
      secretField.attr('type', 'password')
    }
  })

  sendButton.on('click', () => {
    console.log(codeField.val().trim())
    p2.send(codeField.val().trim())
  })
}

document.addEventListener('DOMContentLoaded', init, false)
