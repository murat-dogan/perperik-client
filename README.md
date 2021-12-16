# perperik

`perperik` is a signaling server that could be useful especially for WebRTC clients.

 WebRTC clients need an external signaling server in order to exchange information like ICE Candidates. This is why we need `perperik`!

 * Easy to use
 * Scalable
 * Lightweight

 For more info please visit: [perperik project page](https://github.com/murat-dogan/perperik)


 # perperik-client

 Easy to use perperik client library for NodeJS.

 Example usage;
 ```js
 import { PerperikClient } from 'perperik-client';
 const client: PerperikClient = new PerperikClient();

 client.on('open', () => {
    const myId = client.getId();
    console.log(`# Connection Opened. My ID: ${myId}`);

    client.isPeerOnline('PEER_ID', (err, result) => {
        if (err) return console.log(err);
        if (result) client.sendPeerMessage('PEER_ID', { type: 'msg', str: 'Hello World!' });
    });
});

client.on('peer-msg', (peerID: string, payload: unknown) => {
    console.log(`${peerID}: ${(payload as any).str}`);
});
 ```