import { EventEmitter } from 'events';
import * as ws from 'ws';

export declare interface PerperikClient {
    on(event: 'close', listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    on(event: 'open', listener: (this: WebSocket) => void): this;
    on(event: 'server-error', listener: (this: WebSocket, errMsg: string, info: string) => void): this;
    on(event: 'peer-msg', listener: (this: WebSocket, peerName: string, payload: unknown) => void): this;
}

export class PerperikClient extends EventEmitter {
    private wsClient: ws;
    private name = '__UNKNOWN__';

    constructor(serverAddress: string, options?: ws.ClientOptions) {
        super();

        this.wsClient = new ws(serverAddress, options);

        this.wsClient.on('open', () => {
            console.log('open');
            this.emit('open');
        });

        this.wsClient.on('close', (code, reason) => {
            console.log('close');
            this.emit('close', code, reason);
        });

        this.wsClient.on('error', (err) => {
            console.log(err);
            this.emit('error', err);
        });

        this.wsClient.on('message', (data) => {
            console.log(data.toString());
            try {
                const msg = JSON.parse(data.toString());
                if (!msg || !msg.type) {
                    this.emit('error', `Wrong message format. Received: ${JSON.stringify(msg || {})}`);
                    return;
                }

                switch (msg.type) {
                    case 'welcome':
                        this.name = msg.clientName;
                        break;

                    case 'server-error':
                        this.emit('server-error', msg.errMsg, msg.info);
                        break;

                    case 'peer-msg':
                        this.emit('peer-msg', msg.peerName, msg.payload);
                        break;

                    default:
                        this.emit('error', `Unknown message type. Received: ${JSON.stringify(msg)}`);
                        return;
                }
            } catch (err) {
                this.emit('error', err);
            }
        });
    }

    getName(): string {
        return this.name;
    }

    isOpen(): boolean {
        return this.wsClient.readyState == ws.WebSocket.OPEN;
    }

    sendPeerMessage(peerName: string, payload: unknown): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.wsClient.readyState !== ws.WebSocket.OPEN) {
                return reject(new Error('Socket does not seem open'));
            }

            const msg = { type: 'peer-msg', peerName, payload };
            this.wsClient.send(JSON.stringify(msg), (err) => {
                if (err) return reject(err);
                return resolve(true);
            });
        });
    }
}
