import { Module } from '@nestjs/common';

import { LoggerService } from '../common/logger/logger.service';

import { WssGateway } from './wss.gateway';

@Module({
  imports: [],
  providers: [WssGateway, LoggerService],
  exports: [WssGateway],
  controllers: [],
})
export class WssModule {}
