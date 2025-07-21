import { Module } from '@nestjs/common';

import { LogService } from '../common/log/log.service';

import { WssGateway } from './wss.gateway';

@Module({
  imports: [],
  providers: [WssGateway, LogService],
  exports: [WssGateway],
  controllers: [],
})
export class WssModule {}
