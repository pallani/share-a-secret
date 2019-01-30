/* global $ ClipboardJS ProgressBar otplib io */
function init () {
  let origin = window.location.origin
  let userRole = $('#userRole')
  let userRoleText = $('#userRoleText')
  let userStatus = $('#userStatus')

  let senderContainer = $('#senderContainer')
  // let createContainer = $('#createContainer')
  let secretField = $('#secretField')
  let createSessionButton = $('#createSessionButton')
  let secretErrorMsg = $('#secretErrorMsg')

  let shareContainer = $('#shareContainer')
  let shareableLinkTextArea = $('#shareableLinkTextArea')
  let copyLinkButton = $('#copyLinkButton')

  let tokenContainer = $('#tokenContainer')
  let totpContainer = $('.totp-container')
  let totpCode = $('#totpCode')

  let recipientContainer = $('#recipientContainer')
  let codeField = $('#codeField')
  let decodeButton = $('#decodeButton')
  let decodeErrorMsg = $('#decodeErrorMsg')
  let secretValueTextArea = $('#secretValueTextArea')

  window.room = window.uuid()
  window.otpSecret = window.uuid()

  let totpStep = 60
  otplib.totp.options = {
    step: totpStep
  }

  $('.clipboard-btn').tooltip({
    trigger: 'click',
    placement: 'bottom'
  })

  function setTooltip (message) {
    $('.clipboard-btn').tooltip('hide')
      .attr('data-original-title', message)
      .tooltip('show')
  }

  function hideTooltip () {
    setTimeout(function () {
      $('.clipboard-btn').tooltip('hide')
    }, 1000)
  }

  var clipboard = new ClipboardJS('.clipboard-btn')
  clipboard.on('success', function (e) {
    setTooltip('Copied!')
    hideTooltip()
  })

  clipboard.on('error', function (e) {
    setTooltip('Failed!')
    hideTooltip()
  })

  var totpTimer = new ProgressBar.Circle('#totpTimer', {
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    strokeWidth: 4,
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'}
  })

  function updateTimer () {
    setInterval(() => {
      window.currentTotp = otplib.totp.generate(window.otpSecret)
      window.totpTimeLeft = otplib.totp.timeRemaining()
      totpTimer.set(window.totpTimeLeft / totpStep)
      totpTimer.setText(`${window.totpTimeLeft}`)
      totpCode.text(`${window.currentTotp}`)
    }, 1000)
  }

  function senderSetup () {
    senderContainer.removeClass('d-none')
    userRole.removeClass('d-none')
    userRoleText.html('sender')
    userStatus.html('<i class="fas fa-circle"></i>Pending connection...')
    createSessionButton.on('click', () => {
      if (secretField.val() === '') {
        secretField.css('border', '2px solid #ffc000')
        secretErrorMsg.removeClass('d-none')
      } else {
        secretField.css('border', 'none')
        secretErrorMsg.addClass('d-none')
        let hash = window.room
        shareableLinkTextArea.val(`${origin}/#${window.btoa(JSON.stringify(hash))}`)
        totpContainer.removeClass('inactive')
        window.socket1 = io.connect(origin)
        window.socket1.on('connect', (socket) => {
          shareContainer.removeClass('inactive').addClass('active')
          updateTimer()
          window.socket1.emit('join', window.room)
          window.socket1.on('getOffer', () => {
            window.p = new window.SimplePeer({ initiator: true, trickle: false })
            window.p.on('signal', (data) => {
              window.socket1.emit('offer', {room: window.room, offer: data})
            })
            window.p.on('data', function (data) {
              if (window.currentTotp === '' + data) {
                window.p.send(secretField.val().trim())
              } else {
                window.p.send('Incorrect Code!')
              }
            })
            window.p.on('connect', function (data) {
              window.p.send('Call the person with the secret and ask for the code!')
            })
            window.p.on('close', function () {
              console.log('WebRTC connection has closed!')
            })
            window.p.on('error', function (error) {
              console.log('Error in webrtc:', error)
            })
          })
          window.socket1.on('answer', (answer) => {
            userStatus.html('<i class="fas fa-circle"></i>Connected to a receiver!')
            $('#userStatus i').css({'color': 'green', 'animation': 'none'})
            window.p.signal(JSON.stringify(answer))
          })
        })
      }
    })

    copyLinkButton.on('click', () => {
      tokenContainer.removeClass('inactive').addClass('active')
    })
  }

  function recipientSetup () {
    recipientContainer.removeClass('d-none')
    userRole.removeClass('d-none')
    userRoleText.html('recipient')
    let hash = JSON.parse(window.atob(window.location.hash.substring(1)))
    // var p2 = new window.SimplePeer({ initiator: false, trickle: false })

    window.socket2 = io.connect(origin)
    window.socket2.on('connect', (socket) => {
      window.socket2.emit('join', hash)
      window.socket2.emit('getOffer', {room: hash})
      window.socket2.on('offer', (offer) => {
        window.p2 = new window.SimplePeer({ initiator: false, trickle: false })
        window.p2.signal(JSON.stringify(offer))
        window.p2.on('signal', (data) => {
          window.socket2.emit('answer', {room: hash, answer: data})
          userStatus.html('<i class="fas fa-circle"></i>Connected to a sender!')
          $('#userStatus i').css({'color': 'green', 'animation': 'none'})
        })
        window.p2.on('data', function (data) {
          if (data === 'Incorrect Code!') {
            decodeErrorMsg.removeClass('d-none').text('Incorrect Code!')
            codeField.css({'border': '2px solid #ffc000', 'color': '2px solid #ffc000'})
          } else {
            secretValueTextArea.html('' + data)
          }
        })
      })
    })

    codeField.on('keypress', function (e) {
      if (e.which === 13) {
        window.p2.send(codeField.val().trim())
      }
    })

    decodeButton.on('click', () => {
      try {
        window.p2.send(codeField.val().trim())
      } catch (error) {
        decodeErrorMsg.removeClass('d-none').text('Error encountered when sending code,\nplease create a new session')
      }
    })
  }

  // Sender's workflow
  if (window.location.hash === '') {
    senderSetup()
  } else { // recipient's workflow
    recipientSetup()
  }
}

document.addEventListener('DOMContentLoaded', init, false)
