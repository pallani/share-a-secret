# Share A Secret

Resources:
- https://github.com/adnsio/node-otp
- https://github.com/yeojz/otplib/blob/master/site/public/app.js
- https://socket.io/blog/socket-io-p2p/
- https://github.com/feross/simple-peer
- https://github.com/socketio/socket.io-p2p

```
var otplib = require("otplib")
var totp = require('otplib/totp');
var crypto = require('crypto');
totp.options = { crypto }

const token = totp.generate('KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD');

// const token = otplib.authenticator.generate(secret);
console.log(token, totp.timeRemaining());
// console.log(otplib.authenticator.check(token, secret))
```
