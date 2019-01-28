function init() {
  console.log('window.location.hash:', window.location.hash, window.location.hash === '')
  let origin = window.location.origin

  let senderContainer = $('#senderContainer')
  let createContainer = $('#createContainer')
  let createSessionButton = $('#createSessionButton')

  let shareContainer = $('#shareContainer')
  let shareableLinkTextArea = $('#shareableLinkTextArea')
  let copyLinkButton = $('#copyLinkButton')

  let tokenContainer = $('#tokenContainer')
  let totpContainer = $('.totp-container')
  let totpCode = $('#totpCode')
  let totpTimer = $('svg circle')
  let totpValue = $('#totpValue')
  let totpTimerValue = $('#totpTimerValue')
  let senderStatus = $('#senderStatus')

  let receipientContainer = $('#receipientContainer')
  let decodeButton = $('#decodeButton')
  let secretValue = $('#secretValue')

  window.room = window.uuid()
  window.otpSecret = window.uuid()

  function updateTimer() {
    setInterval(() => {
      window.currentTotp = otplib.totp.generate(window.otpSecret)
      window.totpTimeLeft = otplib.totp.timeRemaining()
      totpCode.text(`${window.currentTotp}`)
      totpValue.text(`${window.currentTotp}`)
      totpTimerValue.text(`${window.totpTimeLeft}`)
      totpTimer.css('stroke-dashoffset', `${Math.floor((30 - window.totpTimeLeft) * 10)}px`)
    }, 1000)
  }

  if (window.location.hash === '') {
    senderContainer.removeClass('d-none')
    createSessionButton.on('click', () => {
      var p = new window.SimplePeer({ initiator: true, trickle: false })
      p.on('error', (err) => console.log('error', err))
      p.on('signal', (data) => {
        console.log('offer:', data)
        console.log('room:', window.room)
        let hash = {
          room: window.room,
          offer: data
        }
        shareableLinkTextArea.val(`${origin}/#${window.btoa(JSON.stringify(hash))}`)
        totpContainer.removeClass('inactive')
        window.socket1 = io.connect(origin) 
        socket1.on('connect', (socket) => {
          shareContainer.removeClass('inactive').addClass('active')
          updateTimer()
          socket1.emit('join', window.room)
          socket1.on('answer', (answer) => {
            senderStatus.text('Connected to a receiver!')
            console.log(JSON.stringify(answer))
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
        p.send('Call   the person with secret and ask for the code!')
      })
    })

    copyLinkButton.on('click', () => {
      tokenContainer.removeClass('inactive').addClass('active')
      $('#shareableLinkTextArea').select()
      document.execCommand('copy')
    })
  } else {
    receipientContainer.removeClass('d-none')
    decodeButton.on('click', () => {
      console.log("hello")
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
        console.log(data)
        secretValue.text(''+data)
      })
    })
  }
}

document.addEventListener('DOMContentLoaded', init, false)