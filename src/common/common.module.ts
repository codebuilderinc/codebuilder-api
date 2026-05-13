import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
//import { QueueModule } from './queue/queue.module';
import { ConfigModule } from './configs/config.module';
//import { LogModule } from './log/log.module';
import { TraceModule } from './trace/trace.module';
import { RedisModule } from './redis/redis.module';
import { CommonLoggerModule } from './logger/logger.module';

@Global()
@Module({
  imports: [DatabaseModule, ConfigModule, TraceModule, RedisModule.forRoot(), CommonLoggerModule],
  exports: [DatabaseModule, ConfigModule, TraceModule, RedisModule, CommonLoggerModule],
})
export class CommonModule {}
