# Client Example

A Simple client example.

First build library with `npm run build`. This will also create example folder and contents.

* Execute example like that at least in two terminal;
```
// Use default perperik server url & An ID will be assigned by server
node lib/example/client.js

// Use your own ID & Custom server URL
ID=MY_ID SERVER_URL=wss://abc.com:8080 node lib/example/client.js
```

* Enter peer ID to start communication
* Query peer state
* Send messages to peer