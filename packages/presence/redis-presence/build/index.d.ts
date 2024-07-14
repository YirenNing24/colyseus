import { Cluster, ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import { Presence } from '@colyseus/core';
type Callback = (...args: any[]) => void;
export declare class RedisPresence implements Presence {
    protected sub: Redis | Cluster;
    protected pub: Redis | Cluster;
    protected subscriptions: {
        [channel: string]: Callback[];
    };
    constructor(options?: number | string | RedisOptions | ClusterNode[], clusterOptions?: ClusterOptions);
    subscribe(topic: string, callback: Callback): Promise<this>;
    unsubscribe(topic: string, callback?: Callback): Promise<this>;
    publish(topic: string, data: any): Promise<void>;
    exists(roomId: string): Promise<boolean>;
    set(key: string, value: string): Promise<unknown>;
    setex(key: string, value: string, seconds: number): Promise<unknown>;
    get(key: string): Promise<unknown>;
    del(roomId: string): Promise<unknown>;
    sadd(key: string, value: any): Promise<unknown>;
    smembers(key: string): Promise<string[]>;
    sismember(key: string, field: string): Promise<number>;
    srem(key: string, value: any): Promise<any>;
    scard(key: string): Promise<any>;
    sinter(...keys: string[]): Promise<any>;
    hset(key: string, field: string, value: string): Promise<any>;
    hincrby(key: string, field: string, value: number): Promise<number>;
    hget(key: string, field: string): Promise<any>;
    hgetall(key: string): Promise<any>;
    hdel(key: string, field: string): Promise<boolean>;
    hlen(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    shutdown(): void;
    protected handleSubscription: (channel: any, message: any) => void;
}
export {};
