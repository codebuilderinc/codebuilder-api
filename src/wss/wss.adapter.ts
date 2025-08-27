import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

//import config from 'config';
import { NextFunction } from 'express';
import Redis from 'ioredis';
import { Server, ServerOptions, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';

import { access_denied, account_blocked, access_token_expired_signature, authorization_failed } from '../common/errors';
import { cors_options_delegate } from '../cors.options';
//import { IAccessToken } from '../oauth/oauth.service';

//const jwt_settings = config.get<IJwtSettings>('JWT_SETTINGS');

export class CustomRedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly sub_client: Redis,
    private readonly pub_client: Redis
  ) {
    super(app);
  }

  public createIOServer(port: number, options?: ServerOptions): Server {
    //console.log('wut the fuck');
    const server = super.createIOServer(port, {
      ...options,
      cors: cors_options_delegate,
      allowEIO3: true,
    });

    server.adapter(createAdapter(this.pub_client, this.sub_client));
    //console.log('hasdhhdwuhu');

    return server;
  }
}
