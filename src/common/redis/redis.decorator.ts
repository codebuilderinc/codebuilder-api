import { applyDecorators } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '../configs/config.service';

export const prefixesForRedisClients: string[] = new Array<string>();

export function RedisServer(prefix: string = '') {
  console.log('RedisServer', prefix);
  if (!prefixesForRedisClients.includes(prefix)) {
    prefixesForRedisClients.push(prefix);
  }
  return Inject(`RedisService${prefix}`);
}

// This function now expects a ConfigService instance to be passed in
export function RedisServers(configService: ConfigService) {
  const configRedisServers = configService.get('REDIS_SERVERS');
  const decorators = [];
  if (configRedisServers && typeof configRedisServers === 'object') {
    for (const key in configRedisServers) {
      decorators.push(Inject(`REDIS_${key}_CLIENT`));
    }
  }
  //console.log('decorators', decorators);
  return applyDecorators(...decorators);
}
