function init () {
  console.log('window.location.hash:', window.location.hash, window.location.hash === '')

  let shareNowButton = $('#shareNowButton')
  let welcomeJumboTron = $('#welcomeJumboTron')
  let mainShareContainer = $('#mainShareContainer')
  let secretField = $('#secretField')
  let showHideButton = $('#showHideButton')

  window.namespace = window.uuid()
  window.otpSecret = window.uuid()

  if (window.location.hash === '') {
    welcomeJumboTron.removeClass('d-none')
  } else {
    let hash = JSON.parse(window.atob(window.location.hash.substring(1)))
    console.log('namespace:', hash.namespace)
    var p2 = new window.SimplePeer({ initiator: false, trickle: false })
    p2.on('signal', (data) => {
      console.log('answer:', data)
    })
    p2.signal(JSON.stringify(hash.offer))
  }

  shareNowButton.on('click', () => {
    welcomeJumboTron.addClass('d-none')
    mainShareContainer.removeClass('d-none')

    if (window.location.hash === '') {
      var p = new window.SimplePeer({ initiator: true, trickle: false })
      p.on('error', (err) => console.log('error', err))
      p.on('signal', (data) => {
        console.log('offer:', data)
        console.log('namespace:', window.namespace)
        let hash = {
          namespace: window.namespace,
          offer: data
        }
        window.location.hash = window.btoa(JSON.stringify(hash))
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
}
function init2 () {
  console.log('window.location.hash:', window.location.hash, window.location.hash === '')
  var p = new window.SimplePeer({ initiator: window.location.hash === '#1', trickle: false })

  p.on('error', (err) => console.log('error', err))

  p.on('signal', function (data) {
    console.log('SIGNAL', JSON.stringify(data))
    document.querySelector('#outgoing').textContent = JSON.stringify(data)
  })

  document.querySelector('form').addEventListener('submit', function (ev) {
    ev.preventDefault()
    p.signal(JSON.parse(document.querySelector('#incoming').value))
  })

  p.on('connect', () => {
    console.log('CONNECT')
    p.send('whatever ' + Math.random())
  })

  p.on('data', function (data) {
    console.log('data: ' + data)
  })
}

document.addEventListener('DOMContentLoaded', init, false)
