import { Provider } from '@nestjs/common';
import IORedis, { Redis } from 'ioredis';
import { REDIS_PUBLISHER_CLIENT, REDIS_SUBSCRIBER_CLIENT } from './redis.constants';
// ⬇️ Switched from the `config` package to your custom ConfigService
import { ConfigService } from '../configs/config.service';

import { prefixesForRedisClients } from './redis.decorator';
import { RedisService } from './redis.service';

/**
 * Factory that turns a base RedisService into a namespaced instance whose
 * `client` property is a connected ioredis client.  We keep exactly the same
 * logging and option-building logic you had before – only the configuration
 * source changed.
 */
function redisFactory(redis: RedisService, prefix: string, cfg: ConfigService): RedisService {
    if (prefix) {
        redis.setPrefix(prefix);

        // 🚚  Pull the JSON string from .env via ConfigService and turn it into an object
        const serversRaw = cfg.get('REDIS_SERVERS');
        const servers = typeof serversRaw === 'string' ? JSON.parse(serversRaw) : serversRaw;
        const server = servers[prefix];

        if (!server) {
            throw new Error(`[REDIS] No server definition for prefix "${prefix}" in REDIS_SERVERS`);
        }

        console.log(`[REDIS] Connecting to ${server.host}:${server.port}`);

        const redisOptions = {
            keepAlive: 30000,
            autoResubscribe: false,
            lazyConnect: true, // Don't attempt to connect when initialising the client
            showFriendlyErrorStack: true, // See https://github.com/luin/ioredis#error-handling
            maxRetriesPerRequest: 10, // Prevent infinite retries
            ...(server.password && server.password.length > 0 && { password: server.password }),
            ...(server.tls && {
                tls: {
                    servername: server.host,
                },
            }),
        } as const;

        console.log(server.port, server.host, redisOptions);
        redis.client = new IORedis(server.port, server.host, redisOptions);

        redis.client.on('connect', () => {
            console.log(`[REDIS] ✅ Redis (${redis.prefix}) connected`);
        });
        redis.client.on('close', () => {
            console.log(`[REDIS] ❌ ${redis.prefix} redis disconnect`);
        });
        redis.client.on('error', (err) => {
            console.log(`[REDIS] ❌ Redis (${redis.prefix}) error: ${err}`);
        });
    }
    return redis;
}

/*
const redisServers = config.get<string>('REDIS_SERVERS');

var redisServerProviders = [];
for (var key in redisServers) {
  if (!redisServers.hasOwnProperty(key)) continue;
  const server = redisServers[key];
  //console.log(`${key} = ${redisServers[key]}`);
  redisServerProviders.push({
    useFactory: (): Redis => {
      console.log(`[REDIS] Connecting to ${server.host}:${server.port}}`);
      return new Redis({
        host: server.host,
        port: server.port,
        ...(server.password && { password: server.password }),
        ...(server.tls === 'true' && {
          tls: {
            servername: server.host,
          },
        }),
        keepAlive: 300,
        autoResubscribe: false,
        lazyConnect: true, // XXX Don't attempt to connect when initializing the client, in order to properly handle connection failure on a use-case basis
        showFriendlyErrorStack: true, // See https://github.com/luin/ioredis#error-handling
        maxRetriesPerRequest: 0, // <-- this seems to prevent retries and allow for try/catch
      });
    },
    provide: `REDIS_${key}_CLIENT`,
    inject: [RedisService],
  });
}
*/

/**
 * Creates a provider for a single prefix so that Nest can inject it as
 * `RedisService<Prefix>`.
 */
function createRedisProvider(prefix: string): Provider<RedisService> {
    return {
        provide: `RedisService${prefix}`,
        // ⬇️ Inject both the base RedisService *and* ConfigService so the factory
        //    can look up host/port/password.
        useFactory: (redis: RedisService, cfg: ConfigService) => redisFactory(redis, prefix, cfg),
        inject: [RedisService, ConfigService],
    };
}

/**
 * Generates providers for *all* prefixes captured by the @RedisServer decorator.
 */
export function createRedisProviders(): Array<Provider<RedisService>> {
    return prefixesForRedisClients.map((prefix) => createRedisProvider(prefix));
}

/* --------------------------------------------------------------------------
 * Core pub/sub clients (unchanged)
 * --------------------------------------------------------------------------*/
export const redisProviders: Provider[] = [
    {
        provide: REDIS_SUBSCRIBER_CLIENT,
        useFactory: (): Redis => {
            return new IORedis({
                host: '127.0.0.1',
                port: 6379,
                // password: '', // uncomment if you need it
            });
        },
    },
    {
        provide: REDIS_PUBLISHER_CLIENT,
        useFactory: (): Redis => {
            return new IORedis({
                host: '127.0.0.1',
                port: 6379,
            });
        },
    },
    // Prefix-based providers are appended at module initialisation time:
    // ...createRedisProviders(),
];

/* For visibility while booting */
console.log('redisProviders', redisProviders);
