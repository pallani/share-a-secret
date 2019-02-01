/* global $ ClipboardJS ProgressBar otplib io moment */
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
  let linkClipboardBtn = $('#linkClipboardBtn')

  let senderConsoleTextArea = $('#senderConsoleTextArea')

  let tokenContainer = $('#tokenContainer')
  let totpContainer = $('.totp-container')
  let totpCode = $('#totpCode')

  let recipientContainer = $('#recipientContainer')
  let codeContainer = $('#codeContainer')
  let codeField = $('#codeField')
  let decodeButton = $('#decodeButton')
  let decodeErrorMsg = $('#decodeErrorMsg')

  let secretContainer = $('#secretContainer')
  let secretValueTextArea = $('#secretValueTextArea')

  let recipientConsoleContainer = $('#recipientConsoleContainer')
  let recipientConsoleTextArea = $('#recipientConsoleTextArea')

  window.room = window.uuid()
  printLogs(senderConsoleTextArea, `Room ID created: ${window.room}`)
  window.otpSecret = window.uuid()
  printLogs(senderConsoleTextArea, `OTP secret created: ${window.otpSecret}`)

  var totpStep = 60
  otplib.totp.options = {
    step: totpStep
  }

  $('.clipboard-btn').tooltip({
    trigger: 'click',
    placement: 'bottom'
  })

  var link_clipboard = new ClipboardJS('#linkClipboardBtn')
  var secret_clipboard = new ClipboardJS('#secretClipboardBtn')
  link_clipboard.on('success', function (e) {
    displayTooltip($('#linkClipboardBtn'), 'Link copied!')
  })
  secret_clipboard.on('success', function (e) {
    displayTooltip($('#secretClipboardBtn'), 'Link copied!')
  })

  var totpTimer = new ProgressBar.Circle('#totpTimer', {
    color: '#FFEA82',
    trailColor: '#eee',
    trailWidth: 1,
    strokeWidth: 4,
    from: {color: '#FFEA82'},
    to: {color: '#ED6A5A'}
  })

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
        printLogs(senderConsoleTextArea, `Generate URL to share with receiver`)
        shareableLinkTextArea.val(`${origin}/#${window.btoa(JSON.stringify(hash))}`)
        totpContainer.removeClass('inactive')
        window.socket1 = io.connect(origin)
        window.socket1.on('connect', (socket) => {
          printLogs(senderConsoleTextArea, `Successfully connected to socket.io server`)
          shareContainer.removeClass('inactive').addClass('active')
          updateTimer()
          printLogs(senderConsoleTextArea, `Emit message to join room in socket.io`)
          window.socket1.emit('join', window.room)
          printLogs(senderConsoleTextArea, `Waiting for receiver to ask for offer`)
          window.socket1.on('getOffer', (config) => {
            window.p = new window.SimplePeer({ initiator: true, trickle: false, config })
            window.p.on('signal', (data) => {
              window.socket1.emit('offer', {room: window.room, offer: data})
            })
            window.p.on('data', function (data) {
              printLogs(senderConsoleTextArea, `Received request from: ${window.p.remoteAddress}; OTP: ${data}`)
              if (window.currentTotp === '' + data) {
                printLogs(senderConsoleTextArea, `Correct code received, secret sent to: ${window.p.remoteAddress}`)
                window.p.send(secretField.val().trim())
              } else {
                printLogs(senderConsoleTextArea, `Incorrect code received from: ${window.p.remoteAddress}`)
                window.p.send('Incorrect Code!')
              }
            })
            window.p.on('connect', function (data) {
              printLogs(senderConsoleTextArea, `Connected to: ${window.p.remoteAddress}`)
              window.p.send(`Call the person with the secret and ask for the code!`)
            })
            window.p.on('close', function () {
              console.log('WebRTC connection has closed!')
              printLogs(senderConsoleTextArea, 'WebRTC connection has closed!')
            })
            window.p.on('error', function (error) {
              console.log('Error in webrtc:', error)
            })
          })
          window.socket1.on('answer', (answer) => {
            printLogs(senderConsoleTextArea, 'Connected to a receiver')
            userStatus.html('<i class="fas fa-circle"></i>Connected to a receiver!')
            $('#userStatus i').css({'color': 'green', 'animation': 'none'})
            window.p.signal(JSON.stringify(answer))
          })
        })
      }
    })

    linkClipboardBtn.on('click', () => {
      tokenContainer.removeClass('inactive').addClass('active')
    })
  }

  function recipientSetup () {
    recipientContainer.removeClass('d-none')
    userRole.removeClass('d-none')
    userRoleText.html('recipient')
    userStatus.html('<i class="fas fa-circle"></i>Pending connection...')
    let hash = JSON.parse(window.atob(window.location.hash.substring(1)))
    printLogs(recipientConsoleTextArea, `Read room id from url hash: ${hash}`)
    window.socket2 = io.connect(origin)
    printLogs(recipientConsoleTextArea, `Connect to socket.io server`)
    window.socket2.on('connect', (socket) => {
      printLogs(recipientConsoleTextArea, `Successfully connected to socket.io server`)
      printLogs(recipientConsoleTextArea, `Emit message to join room in socket.io`)
      window.socket2.emit('join', hash)
      printLogs(recipientConsoleTextArea, `Emit message in socket.io to ask for webrtc offer from sender`)
      window.socket2.emit('getOffer', {room: hash})
      printLogs(recipientConsoleTextArea, `Wait for webrtc offer from sender`)
      window.socket2.on('offer', (offerPayload) => {
        printLogs(recipientConsoleTextArea, `Use offer to generate webrtc answer`)
        window.p2 = new window.SimplePeer({ initiator: false, trickle: false, config: { iceServers: offerPayload.iceServers } })
        window.p2.signal(JSON.stringify(offerPayload.offer))
        printLogs(recipientConsoleTextArea, `Send webrtc answer via socket.io`)
        window.p2.on('signal', (data) => {
          printLogs(recipientConsoleTextArea, `Sender should complete webrtc using the webrtc answer`)
          window.socket2.emit('answer', {room: hash, answer: data})
          codeContainer.removeClass('inactive').addClass('active')
          secretContainer.removeClass('inactive').addClass('active')
          recipientConsoleContainer.removeClass('inactive').addClass('active')
          userStatus.html('<i class="fas fa-circle"></i>Connected to a sender!')
          $('#userStatus i').css({'color': 'green', 'animation': 'none'})
          printLogs(recipientConsoleTextArea, `Waiting for TOTP`)
        })
        window.p2.on('data', function (data) {
          if (data === 'Incorrect Code!') {
            decodeErrorMsg.removeClass('d-none').text('Incorrect Code!')
            codeField.css({'border': '2px solid #ffc000', 'color': '2px solid #ffc000'})
          } else if (Decodeuint8arr(data) === 'Call the person with the secret and ask for the code!') {
            secretValueTextArea.html('' + data)
          } else {
            secretValueTextArea.html('' + data)
            printLogs(recipientConsoleTextArea, `Secret received: ${data}`)
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
        printLogs(recipientConsoleTextArea, `Sending totp using webtc connection`)
        window.p2.send(codeField.val().trim())
      } catch (error) {
        console.log(error)
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

  function updateTimer () {
    setInterval(() => {
      window.currentTotp = otplib.totp.generate(window.otpSecret)
      window.totpTimeLeft = otplib.totp.timeRemaining()
      totpTimer.set(window.totpTimeLeft / totpStep)
      totpTimer.setText(`${window.totpTimeLeft}`)
      totpCode.text(`${window.currentTotp}`)
    }, 1000)
  }

  function displayTooltip (el, message) {
    el.tooltip('hide')
      .attr('data-original-title', message)
      .tooltip('show')
    setTimeout(function () {
      el.tooltip('hide')
    }, 1000)
  }

  function Decodeuint8arr (uint8array) {
    return new TextDecoder('utf-8').decode(uint8array)
  }

  function printLogs (el, message) {
    var now = moment().format("YYYY-MM-DD HH:mm:ss");
    var lineEntry = now + '&#9;' + message
    el.html(lineEntry + '\n' + el.val())
  }
}

document.addEventListener('DOMContentLoaded', init, false)
