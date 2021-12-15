# Client Example

A Simple client example.

First build library with `npm run build`. This will also create example folder and contents.

* Execute example like that at least in two terminal;
```
// An ID will be assigned by server
SERVER_URL=wss://abc.com:8080 node lib/example/client.js

// Use your own ID
ID=MY_ID SERVER_URL=wss://abc.com:8080 node lib/example/client.js

// Use perperik test server with SSL
// NODE_TLS_REJECT_UNAUTHORIZED is needed for self-signed certificates
SERVER_URL=wss://localhost:8080 NODE_TLS_REJECT_UNAUTHORIZED=0 node lib/example/client.js
```

* Enter peer ID to start communication
* Query peer state
* Send messages to peer