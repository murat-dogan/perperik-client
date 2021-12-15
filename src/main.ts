import { EventEmitter } from 'events';
import * as ws from 'ws';
import { nanoid } from 'nanoid';
import {
    Message2Client,
    Message2ClientError,
    Message2ClientPeer,
    Message2ClientQuery,
    Message2ClientWelcome,
    Message2ServerPeer,
    Message2ServerQuery,
} from './message/message-types';

export declare interface PerperikClient {
    on(event: 'close', listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    on(event: 'open', listener: (this: WebSocket) => void): this;
    on(event: 'server-error', listener: (this: WebSocket, errMsg: string, info: string) => void): this;
    on(event: 'peer-msg', listener: (this: WebSocket, peerID: string, payload: unknown) => void): this;
}

export class PerperikClient extends EventEmitter {
    private wsClient: ws;
    private id = '';
    private timeoutInMS = 5000;

    // is-peer-online query cbs
    private queryIsOnlineCBList: { [index: string]: (err: Error | null, result?: boolean) => void } = {};

    constructor(
        id: string | undefined | null,
        serverAddress: string,
        options?: { timeoutInMS: number },
        wsOptions?: ws.ClientOptions,
    ) {
        super();

        // Options
        if (options) {
            if (options.timeoutInMS) this.timeoutInMS = options.timeoutInMS;
        }

        // construct server url
        let serverUrl = serverAddress;
        if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) serverUrl = 'ws://' + serverUrl;
        if (id) serverUrl += `?id=${id}`;

        // create ws
        this.wsClient = new ws(serverUrl, wsOptions);

        this.wsClient.on('close', (code, reason) => {
            this.emit('close', code, reason);
        });

        this.wsClient.on('error', (err) => {
            this.emit('error', err);
        });

        this.wsClient.on('message', (data) => {
            // console.log(data.toString());
            try {
                const msg: Message2Client = JSON.parse(data.toString());
                if (!msg || !msg.type) {
                    this.emit('error', `Wrong message format. Received: ${JSON.stringify(msg || {})}`);
                    return;
                }

                switch (msg.type) {
                    case 'welcome':
                        this.handleWelcomeMessage(msg as Message2ClientWelcome);
                        break;

                    case 'server-error':
                        this.handleServerErrorMessage(msg as Message2ClientError);
                        break;

                    case 'peer-msg':
                        this.handlePeerMessage(msg as Message2ClientPeer);
                        break;

                    case 'server-query':
                        this.handleQueryMessage(msg as Message2ClientQuery);
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

    getId(): string {
        return this.id;
    }

    isOpen(): boolean {
        return this.wsClient.readyState == ws.WebSocket.OPEN;
    }

    isPeerOnline(peerID: string, cb: (err: Error | null, result?: boolean) => void): void {
        if (this.wsClient.readyState !== ws.WebSocket.OPEN) {
            return cb(new Error('Socket does not seem open'));
        }

        const msg: Message2ServerQuery = {
            type: 'server-query',
            query: 'is-peer-online',
            queryRef: nanoid(),
            peerID,
        };

        this.wsClient.send(JSON.stringify(msg), (err) => {
            if (err) return cb(err);

            // save cb for future call
            this.queryIsOnlineCBList[msg.queryRef as string] = cb;

            // start timeout counter
            setTimeout(() => {
                // if cb not called, call it with error
                if (this.queryIsOnlineCBList[msg.queryRef as string]) {
                    cb(new Error('Timeout'));
                    delete this.queryIsOnlineCBList[msg.queryRef as string];
                }
            }, this.timeoutInMS);
        });
    }

    sendPeerMessage(peerID: string, payload: unknown): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.wsClient.readyState !== ws.WebSocket.OPEN) {
                return reject(new Error('Socket does not seem open'));
            }

            const msg: Message2ServerPeer = { type: 'peer-msg', peerID, payload };
            this.wsClient.send(JSON.stringify(msg), (err) => {
                if (err) return reject(err);
                return resolve(true);
            });
        });
    }

    destroy(): void {
        this.wsClient.terminate();
    }

    private handleWelcomeMessage(msg: Message2ClientWelcome): void {
        this.id = msg.id;
        this.emit('open');
    }

    private handleServerErrorMessage(msg: Message2ClientError): void {
        this.emit('server-error', msg.errMsg, msg.info);
    }

    private handlePeerMessage(msg: Message2ClientPeer): void {
        this.emit('peer-msg', msg.peerID, msg.payload);
    }

    private handleQueryMessage(msg: Message2ClientQuery): void {
        if (!msg.query) {
            this.emit('error', `Invalid server-query type. Received: ${JSON.stringify(msg)}`);
            return;
        }

        switch (msg.query) {
            case 'is-peer-online':
                if (msg.queryRef && this.queryIsOnlineCBList[msg.queryRef]) {
                    this.queryIsOnlineCBList[msg.queryRef](null, msg.result);
                    delete this.queryIsOnlineCBList[msg.queryRef];
                }
                break;
            default:
                this.emit('error', `Unknown server-query type. Received: ${JSON.stringify(msg)}`);
                return;
        }
    }
}
