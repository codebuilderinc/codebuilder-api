import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
//import { QueueModule } from './queue/queue.module';
import { ConfigModule } from './configs/config.module';
import { LogModule } from './log/log.module';
import { TraceModule } from './trace/trace.module';

@Global()
@Module({
    imports: [DatabaseModule, ConfigModule, LogModule, TraceModule],
    exports: [DatabaseModule, ConfigModule, LogModule, TraceModule],
})
export class CommonModule {}
