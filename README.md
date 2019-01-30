# Share A Secret

## TODO
1. Improve connection messaging
	- The current connection status isn't detailed enough
		- Signaling connection using socket.io
		- WebRTC connection
2. Set-up TURN server to allow app to work through firewalls and NAT
3. Improve overall security of app by looking at webrtc encryption
4. Additional logging for webrtc connection sequence

## Flows

### Sender
1. User enters secret
2. Generate unique room id for signaling via socket.io
3. Generate unique secret for TOTP generation
4. Get offer for webrtc connection
5. Generate url to share with receiver
6. Connect to socket.io server
7. Emit message to join room in socket.io
8. Wait for receiver to ask for offer
9. Send offer to receiver using socket.io
10. Wait for reveiver to send answer via socket.io
11. Complete webrtc connection using received answer
12. Wait for totp from webrtc connection
13. Send whatever is in the secret field if the received totp matched current totp

### Receiver
1. Read room id from url hash
2. Connect to socket.io server
3. Emit message to join room in socket.io
4. Emit message in socket.io to ask for webrtc offer from sender
5. Wait for webrtc offer from sender
6. Use offer to generate webrtc answer
7. Send webrtc answer via socket.io
8. Sender should complete webrtc using the webrtc answer
8. Wait for user to enter totp
9. Send totp using webtc connection
10. Wait for reply from webrtc connection

Resources:
- https://github.com/adnsio/node-otp
- https://github.com/yeojz/otplib/blob/master/site/public/app.js
- https://socket.io/blog/socket-io-p2p/
- https://github.com/feross/simple-peer
- https://github.com/socketio/socket.io-p2p
- https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/
- https://hpbn.co/webrtc/
- https://downloads.newyorker.com/mp3/fiction/110819_fiction_rushdie.mp3
- https://github.com/joelchoo/web-crypto/blob/master/design.md
- https://github.com/wardhanster/simplertc_heroku
- https://www.apple.com/business/site/docs/iOS_Security_Guide.pdf
- https://developer.apple.com/documentation/security/certificate_key_and_trust_services/keys/storing_keys_in_the_secure_enclave
