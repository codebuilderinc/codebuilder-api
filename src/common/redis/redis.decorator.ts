import { Inject, applyDecorators } from '@nestjs/common';

export const prefixesForRedisClients: string[] = [];

/* Inject a *single* named RedisService instance
 *   @RedisServer('AUTH') myRedis: RedisService
 */
export function RedisServer(prefix = '') {
    if (!prefixesForRedisClients.includes(prefix)) {
        prefixesForRedisClients.push(prefix);
    }
    return Inject(`RedisService${prefix}`);
}

/* Inject *all* prefixed Redis clients
 *   constructor(@RedisServers() ...args: RedisService[]) {}
 */
export function RedisServers() {
    return applyDecorators(...prefixesForRedisClients.map((p) => Inject(`RedisService${p}`)));
}
