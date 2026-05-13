import { Inject, Injectable, Scope } from '@nestjs/common';
import Redis, { RedisKey } from 'ioredis';
import { Observable, Observer } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { REDIS_EXPIRE_TIME_IN_SECONDS, REDIS_PUBLISHER_CLIENT, REDIS_SUBSCRIBER_CLIENT } from './redis.constants';
import { ConfigService } from '../configs/config.service';

export interface IRedisSubscribeMessage {
  readonly message: string;
  readonly channel: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class RedisService /* implements OnModuleInit, OnModuleDestroy */ {
  public prefix?: string;
  public client?: Redis;

  constructor(
    @Inject(REDIS_SUBSCRIBER_CLIENT) private readonly subClient: Redis,
    @Inject(REDIS_PUBLISHER_CLIENT) private readonly pubClient: Redis,
    private readonly cfg: ConfigService
  ) {}

  /* ------------ utility ------------- */

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  getClientLabel(msg: string) {
    return this.prefix ? `[${this.prefix}] ${msg}` : msg;
  }

  /* ------------ pub/sub -------------- */

  fromEvent<T = any>(eventName: string): Observable<T> {
    this.subClient.subscribe(eventName);

    return new Observable((observer: Observer<IRedisSubscribeMessage>) =>
      this.subClient.on('message', (channel, message) => observer.next({ channel, message }))
    ).pipe(
      filter(({ channel }) => channel === eventName),
      map(({ message }) => JSON.parse(message))
    );
  }

  async publish(channel: string, value: unknown): Promise<number> {
    return await this.pubClient.publish(channel, JSON.stringify(value));
  }

  /* ------------ KV helpers ----------- */

  private async safe<T>(fn: () => Promise<T>): Promise<T | 0> {
    try {
      return await fn();
    } catch (e) {
      console.log('!! Redis error:', e);
      return 0 as const;
    }
  }

  ReadOne(key: string) {
    return this.safe(() => this.client.get(key));
  }

  Write(key: string, value: string, expiry?: number) {
    return this.safe(() => (expiry ? this.client.setex(key, expiry, value) : this.client.set(key, value)));
  }

  DeleteOne(key: string) {
    return this.safe(() => this.client.expire(key, -1));
  }

  /* ----- JSON-serialised helpers ----- */

  async set(key: RedisKey, value: unknown, exp = REDIS_EXPIRE_TIME_IN_SECONDS) {
    await this.pubClient.set(key, JSON.stringify(value), 'EX', exp);
  }

  async get<T = any>(key: RedisKey) {
    const raw = await this.pubClient.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  /* ---------- hash helpers ----------- */

  hset(key: RedisKey, field: string, value: string) {
    return this.pubClient.hset(key, field, value);
  }

  hdel(key: RedisKey, ...fields: string[]) {
    return this.pubClient.hdel(key, ...fields);
  }

  hget(key: RedisKey, field: string) {
    return this.pubClient.hget(key, field);
  }

  hgetall(key: RedisKey) {
    return this.pubClient.hgetall(key);
  }

  /* ---------- misc helpers ----------- */

  del(key: RedisKey) {
    return this.pubClient.del(key);
  }

  mget(keys: RedisKey[]) {
    return this.pubClient.mget(keys).then((arr) => arr.map((v) => JSON.parse(v || null)));
  }

  mset(data: (string | number)[]) {
    return this.pubClient.mset(data);
  }
}
