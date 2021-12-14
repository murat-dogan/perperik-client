/// <reference types="node" />
import { EventEmitter } from 'events';
import * as ws from 'ws';
export declare interface PerperikClient {
    on(event: 'close', listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    on(event: 'open', listener: (this: WebSocket) => void): this;
    on(event: 'server-error', listener: (this: WebSocket, errMsg: string, info: string) => void): this;
    on(event: 'peer-msg', listener: (this: WebSocket, peerName: string, payload: unknown) => void): this;
}
export declare class PerperikClient extends EventEmitter {
    private wsClient;
    private name;
    constructor(serverAddress: string, options?: ws.ClientOptions);
    getName(): string;
    isOpen(): boolean;
    sendPeerMessage(peerName: string, payload: unknown): Promise<boolean>;
}
