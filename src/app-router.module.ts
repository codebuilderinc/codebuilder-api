import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CloudflareKvModule } from './cloudflare-kv/cloudflare-kv.module';
import { WssModule } from './wss/wss.module';
import { JobModule } from './jobs/job.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'ws',
        module: WssModule,
      },
      {
        path: 'api',
        children: [
          {
            path: '', // Empty path here - the controller already has 'jobs' path
            module: JobModule,
          },
          {
            path: '', // Empty path here - the controller already has 'auth' path
            module: AuthModule,
          },
        ],
      },
    ]),
    CloudflareKvModule,
    JobModule,
    AuthModule,
  ],
  exports: [RouterModule],
})
export class AppRouterModule {}
