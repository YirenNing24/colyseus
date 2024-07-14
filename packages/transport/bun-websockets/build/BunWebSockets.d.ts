import { ServerWebSocket, WebSocketHandler } from "bun";
import { Transport } from '@colyseus/core';
import { WebSocketWrapper } from './WebSocketClient';
import type { Application, Request, Response } from "express";
export type TransportOptions = Partial<Omit<WebSocketHandler, "message" | "open" | "drain" | "close" | "ping" | "pong">>;
interface WebSocketData {
    url: URL;
}
export declare class BunWebSockets extends Transport {
    private options;
    expressApp: Application;
    protected clients: ServerWebSocket<WebSocketData>[];
    protected clientWrappers: WeakMap<ServerWebSocket<WebSocketData>, WebSocketWrapper>;
    private _listening;
    private _originalRawSend;
    constructor(options?: TransportOptions);
    listen(port: number, hostname?: string, backlog?: number, listeningListener?: () => void): this;
    shutdown(): void;
    simulateLatency(milliseconds: number): void;
    protected onConnection(rawClient: ServerWebSocket<WebSocketData>): Promise<void>;
    protected handleMatchMakeRequest(req: Request, res: Response): Promise<void>;
}
export {};
