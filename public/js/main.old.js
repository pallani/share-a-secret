function init () {
  const socket = io.connect('http://localhost:10000')
  const opts = {peerOpts: {trickle: false}, autoUpgrade: false}
  const p2p = new P2P(socket, opts, () => {
    privateButton.disabled = false
    p2p.emit('peer-obj', 'Hello there. I am ' + p2p.peerId)
  })

  // Elements
  var privateButton = document.getElementById('private')
  var form = document.getElementById('msg-form')
  var box = document.getElementById('msg-box')
  var boxFile = document.getElementById('msg-file')
  var msgList = document.getElementById('msg-list')
  var upgradeMsg = document.getElementById('upgrade-msg')

  p2p.on('peer-msg', function (data) {
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(data.textVal))
    msgList.appendChild(li)
  })

  p2p.on('peer-file', function (data) {
    var li = document.createElement('li')
    var fileBytes = new Uint8Array(data.file)
    var blob = new window.Blob([fileBytes], {type: 'image/jpeg'})
    var urlCreator = window.URL || window.webkitURL
    var fileUrl = urlCreator.createObjectURL(blob)
    var a = document.createElement('a')
    var linkText = document.createTextNode('New file')
    a.href = fileUrl
    a.appendChild(linkText)
    li.appendChild(a)
    msgList.appendChild(li)
  })

  form.addEventListener('submit', function (e, d) {
      e.preventDefault()
      var li = document.createElement('li')
      li.appendChild(document.createTextNode(box.value))
      msgList.appendChild(li)
      if (boxFile.value !== '') {
        var reader = new window.FileReader()
        reader.onload = function (evnt) {
          p2p.emit('peer-file', {file: evnt.target.result})
        }
        reader.onerror = function (err) {
          console.error('Error while reading file', err)
        }
        reader.readAsArrayBuffer(boxFile.files[0])
      } else {
        p2p.emit('peer-msg', {textVal: box.value})
      }
      box.value = ''
      boxFile.value = ''
  })

  privateButton.addEventListener('click', function (e) {
      goPrivate()
      p2p.emit('go-private', true)
    })

    p2p.on('go-private', function () {
      goPrivate()
    })

  function goPrivate () {
    p2p.useSockets = false
    upgradeMsg.innerHTML = 'WebRTC connection established!'
    privateButton.disabled = true
  }
}


// const p2p = new P2P(socket, { autoUpgrade: true, numClients: 1}, () => {
//   console.log('We all speak WebRTC now')
// })

// p2p.on('ready', function(){
//   p2p.usePeerConnection = true;
//   p2p.emit('peer-obj', { peerId: 1234 });
// })

// this event will be triggered over the socket transport
// until `usePeerConnection` is set to `true`
// p2p.on('peer-msg', function(data){
//   console.log('From a peer %s', data)
// })

document.addEventListener('DOMContentLoaded', init, false)
