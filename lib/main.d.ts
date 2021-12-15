/// <reference types="node" />
import { EventEmitter } from 'events';
import * as ws from 'ws';
export declare interface PerperikClient {
    on(event: 'close', listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
    on(event: 'open', listener: (this: WebSocket) => void): this;
    on(event: 'server-error', listener: (this: WebSocket, errMsg: string, info: string) => void): this;
    on(event: 'peer-msg', listener: (this: WebSocket, peerID: string, payload: unknown) => void): this;
}
export declare class PerperikClient extends EventEmitter {
    private wsClient;
    private id;
    private timeoutInMS;
    private queryIsOnlineCBList;
    constructor(id: string | null, serverAddress: string, options?: {
        timeoutInMS: number;
    }, wsOptions?: ws.ClientOptions);
    getId(): string;
    isOpen(): boolean;
    isPeerOnline(peerID: string, cb: (err: Error | null, result?: boolean) => void): void;
    sendPeerMessage(peerID: string, payload: unknown): Promise<boolean>;
    private handleWelcomeMessage;
    private handleServerErrorMessage;
    private handlePeerMessage;
    private handleQueryMessage;
}
