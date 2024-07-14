import { RoomListingData } from '@colyseus/core';
import { Cluster } from 'ioredis';
export declare class RoomData implements RoomListingData {
    #private;
    clients: number;
    locked: boolean;
    private: boolean;
    maxClients: number;
    metadata: any;
    name: string;
    publicAddress: string;
    processId: string;
    roomId: string;
    createdAt: Date;
    unlisted: boolean;
    constructor(initialValues: any, client: Redis | Cluster);
    toJSON(): {
        clients: number;
        createdAt: Date;
        maxClients: number;
        metadata: any;
        name: string;
        publicAddress: string;
        processId: string;
        roomId: string;
    };
    save(): Promise<void>;
    updateOne(operations: any): Promise<void>;
    remove(): Promise<any>;
    private hset;
    private hdel;
}
