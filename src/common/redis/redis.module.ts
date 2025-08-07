import { Module, DynamicModule, Global } from '@nestjs/common';
import { redisProviders, createRedisProviders } from './redis.providers';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class RedisModule {
    static forRoot(): DynamicModule {
        const prefixedRedisProviders = createRedisProviders();
        return {
            module: RedisModule,
            providers: [...redisProviders, RedisService, ...prefixedRedisProviders],
            exports: [...redisProviders, RedisService, ...prefixedRedisProviders],
        };
    }
}
