function init() {
  let origin = window.location.origin
  let userRole = $('#userRole')
  let userRoleText = $('#userRoleText')
  let userStatus = $('#userStatus')

  let senderContainer = $('#senderContainer')
  // let createContainer = $('#createContainer')
  let secretField = $('#secretField')
  let createSessionButton = $('#createSessionButton')

  let shareContainer = $('#shareContainer')
  let shareableLinkTextArea = $('#shareableLinkTextArea')
  let copyLinkButton = $('#copyLinkButton')

  let tokenContainer = $('#tokenContainer')
  let totpContainer = $('.totp-container')
  let totpCode = $('#totpCode')

  let recipientContainer = $('#recipientContainer')
  let codeField = $('#codeField')
  let decodeButton = $('#decodeButton')
  let secretValueTextArea = $('#secretValueTextArea')

  window.room = window.uuid()
  window.otpSecret = window.uuid()

  var totpTimer = new ProgressBar.Circle('#totpTimer', {
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    strokeWidth: 4,
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'},
  });

  function updateTimer() {
    setInterval(() => {
      window.currentTotp = otplib.totp.generate(window.otpSecret)
      window.totpTimeLeft = otplib.totp.timeRemaining()
      totpTimer.set(window.totpTimeLeft/30)
      totpTimer.setText(`${window.totpTimeLeft}`)
      totpCode.text(`${window.currentTotp}`)
    }, 1000)
  }

  // Sender's workflow
  if (window.location.hash === '') { 
    senderContainer.removeClass('d-none')
    userRole.removeClass('d-none')
    userRoleText.html('sender')
    userStatus.html('<i class="fas fa-circle"></i>Pending connection...')
    createSessionButton.on('click', () => {
      if (secretField.val() == '') {
        secretField.css('border', '2px solid red')
      } else {
        secretField.css('border', 'none')
        var p = new window.SimplePeer({ initiator: true, trickle: false })
        p.on('error', (err) => console.log('error', err))
        p.on('signal', (data) => {
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
              userStatus.html('<i class="fas fa-circle"></i>Connected to a receiver!')
              $('#userStatus i').css({'color': 'green', 'animation': 'none'})
              p.signal(JSON.stringify(answer))
            })
          })
        })
        p.on('data', function (data) {
          if (window.currentTotp === '' + data) {
            p.send(secretField.val().trim())
          } else {
            p.send("Incorrect Code!")
          }
        })
        p.on('connect', function (data) {
          p.send('Call the person with the secret and ask for the code!')
        })
      }
    })

    copyLinkButton.on('click', () => {
      tokenContainer.removeClass('inactive').addClass('active')
      $('#shareableLinkTextArea').select()
      document.execCommand('copy')
    })
  } else { // recipient's workflow
    recipientContainer.removeClass('d-none')
    userRole.removeClass('d-none')
    userRoleText.html('recipient')
    let hash = JSON.parse(window.atob(window.location.hash.substring(1)))
    var p2 = new window.SimplePeer({ initiator: false, trickle: false })
    p2.on('signal', (data) => {
      window.socket2 = io.connect(origin)
      socket2.on('connect', (socket) => {
        socket2.emit('join', hash.room)
        socket2.emit('answer', { room: hash.room, answer: data})
        userStatus.html('<i class="fas fa-circle"></i>Connected to a sender!')
        $('#userStatus i').css({'color': 'green', 'animation': 'none'})
      })  
    })
    p2.signal(JSON.stringify(hash.offer))
    p2.on('data', function (data) {
      secretValueTextArea.html(''+data)
    })

    decodeButton.on('click', () => {
      p2.send(codeField.val().trim())
    })
  }
}

document.addEventListener('DOMContentLoaded', init, false)