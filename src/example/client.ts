import * as readline from 'readline';
import { PerperikClient } from '../main';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const client: PerperikClient = new PerperikClient(process.env.ID, {
    serverURL: process.env.SERVER_URL || '',
});

client.on('open', () => {
    const myId = client.getId();
    console.log(`# Connection Opened. \nMy ID: ${myId}`);

    rl.question('Enter PeerID:', function (peerID) {
        menu(peerID);
    });

    function menu(peerID: string): void {
        rl.question('Message|Query|help: ', function (str) {
            switch (str) {
                case 'exit':
                    rl.close();
                    client.destroy();
                    process.exit();
                case 'help':
                    console.log('* Write your message to send to peer');
                    console.log('* help: Print this info');
                    console.log('* is-online : Query peer if it is online\n\n');
                    menu(peerID);
                    break;
                case 'is-online':
                    client.isPeerOnline(peerID, (err, result) => {
                        if (err) console.log(err);
                        else {
                            console.log(result);
                        }
                        menu(peerID);
                    });
                    break;
                default:
                    client.sendPeerMessage(peerID, str);
                    menu(peerID);
            }
        });
    }
});

client.on('close', () => {
    console.log(`# Connection Closed`);
});

client.on('error', (err) => {
    console.log(`# Error:`, err);
});

client.on('server-error', (err) => {
    console.log(`[Server Error:`, err, ']');
});

client.on('peer-msg', (peerID: string, payload: unknown) => {
    console.log(`${peerID}: ${JSON.stringify(payload)}`);
});
