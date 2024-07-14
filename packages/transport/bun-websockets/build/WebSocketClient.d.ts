import { ServerWebSocket } from "bun";
import EventEmitter from 'events';
import { Client, ClientState, ISendOptions } from '@colyseus/core';
export declare class WebSocketWrapper extends EventEmitter {
    ws: ServerWebSocket<any>;
    constructor(ws: ServerWebSocket<any>);
}
export declare class WebSocketClient implements Client {
    id: string;
    ref: WebSocketWrapper;
    sessionId: string;
    state: ClientState;
    _enqueuedMessages: any[];
    _afterNextPatchQueue: any;
    _reconnectionToken: string;
    constructor(id: string, ref: WebSocketWrapper);
    sendBytes(type: string | number, bytes: number[] | Uint8Array, options?: ISendOptions): void;
    send(messageOrType: any, messageOrOptions?: any | ISendOptions, options?: ISendOptions): void;
    enqueueRaw(data: ArrayLike<number>, options?: ISendOptions): void;
    raw(data: ArrayLike<number>, options?: ISendOptions, cb?: (err?: Error) => void): void;
    error(code: number, message?: string, cb?: (err?: Error) => void): void;
    get readyState(): any;
    leave(code?: number, data?: string): void;
    close(code?: number, data?: string): void;
    toJSON(): {
        sessionId: string;
        readyState: any;
    };
}
