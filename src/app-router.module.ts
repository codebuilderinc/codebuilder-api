import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CloudflareKvModule } from './cloudflare-kv/cloudflare-kv.module';
import { WssModule } from './wss/wss.module';
import { JobModule } from './jobs/job.module';
import { AuthModule } from './auth/auth.module';
import { RedditModule } from './reddit/reddit.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'ws',
        module: WssModule,
      },
    ]),
    CloudflareKvModule,
    JobModule,
    AuthModule,
    RedditModule,
  ],
  exports: [RouterModule],
})
export class AppRouterModule {}
