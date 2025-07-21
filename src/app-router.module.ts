import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CloudflareKvModule } from './cloudflare-kv/cloudflare-kv.module';
import { WssModule } from './wss/wss.module';
import { JobModule } from './jobs/job.module';

@Module({
    imports: [
        RouterModule.register([
            {
                path: 'ws',
                module: WssModule,
            },
            {
                path: 'api',
                module: JobModule,
            },
        ]),
        CloudflareKvModule,
        JobModule,
    ],
    exports: [RouterModule],
})
export class AppRouterModule {}
