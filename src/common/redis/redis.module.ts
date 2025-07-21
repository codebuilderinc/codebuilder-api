import { Module, DynamicModule } from '@nestjs/common';
import { redisProviders, createRedisProviders } from './redis.providers';
import { RedisService } from './redis.service';

//const loggerProviders = createRedisProviders();

/*@Module({
  providers: [...redisProviders, RedisService, ...loggerProviders],
  exports: [...redisProviders, RedisService, ...loggerProviders],
})*/
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
