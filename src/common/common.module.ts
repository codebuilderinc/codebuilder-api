import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
//import { QueueModule } from './queue/queue.module';
import { ConfigModule } from './configs/config.module';
import { LogModule } from './log/log.module';
import { TraceModule } from './trace/trace.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
    imports: [DatabaseModule, ConfigModule, LogModule, TraceModule, RedisModule.forRoot()],
    exports: [DatabaseModule, ConfigModule, LogModule, TraceModule, RedisModule],
})
export class CommonModule {}
