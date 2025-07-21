import { Module } from '@nestjs/common';
import { CloudflareKvService } from './cloudflare-kv.service';

@Module({
  exports: [CloudflareKvService],
  providers: [CloudflareKvService],
})
export class CloudflareKvModule {}
