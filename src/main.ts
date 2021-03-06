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

const DEFAULT_SERVER_URL = 'wss://perperik.fly.dev';

export declare interface PerperikClient {
    on(event: 'close', listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    on(event: 'open', listener: (this: WebSocket) => void): this;
    on(event: 'server-error', listener: (this: WebSocket, errMsg: string, info: string) => void): this;
    on(
        event: 'peer-msg',
        listener: <T extends { type: string }>(this: WebSocket, peerID: string, payload: T) => void,
    ): this;
}

export class PerperikClient extends EventEmitter {
    private wsClient: ws;
    private id = '';
    private timeoutInMS: number;

    // is-peer-online query cbs
    private queryIsOnlineCBList: { [index: string]: (err: Error | null, result?: boolean) => void } = {};

    constructor(
        id?: string | undefined | null,
        options?: { serverURL?: string; timeoutInMS?: number },
        wsOptions?: ws.ClientOptions,
    ) {
        super();

        // Options
        this.timeoutInMS = options && options.timeoutInMS ? options.timeoutInMS : 5000;

        // construct server url
        let serverUrl = options && options.serverURL ? options.serverURL : DEFAULT_SERVER_URL;
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
                    case 'pk-welcome':
                        this.handleWelcomeMessage(msg as Message2ClientWelcome);
                        break;

                    case 'pk-server-error':
                        this.handleServerErrorMessage(msg as Message2ClientError);
                        break;

                    case 'pk-server-query':
                        this.handleQueryMessage(msg as Message2ClientQuery);
                        break;

                    default:
                        // If meesage is not for me than it is a peer msg
                        this.handlePeerMessage(msg as Message2ClientPeer);
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
            type: 'pk-server-query',
            query: 'is-peer-online',
            queryRef: nanoid(),
            id: peerID,
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

    sendPeerMessage<T extends { type: string }>(peerID: string, payload: T): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (this.wsClient.readyState !== ws.WebSocket.OPEN) {
                return reject(new Error('Socket does not seem open'));
            }

            if (!payload) {
                return reject(new Error('Invalid payload '));
            }

            const msg: Message2ServerPeer = Object.assign(payload, { id: peerID });
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
        this.emit('peer-msg', msg.id, msg);
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
