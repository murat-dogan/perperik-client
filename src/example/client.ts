import { PerperikClient } from '../main';

const client: PerperikClient = new PerperikClient('wss://localhost:8080');

client.on('open', () => {
    client.sendPeerMessage('9j51tidinx-hpjcwm5jcj', { a: 12345 });
});
