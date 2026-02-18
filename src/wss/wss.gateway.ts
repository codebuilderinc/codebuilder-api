import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';

import io from 'socket.io';
import { NextFunction } from 'express';
import Redis from 'ioredis';
import { Server, ServerOptions, Socket } from 'socket.io';
import { LoggerService } from '../common/logger/logger.service';

//const wss_settings = config.get<IWssSettings>('WSS_SETTINGS');
/*
@WebSocketGateway(8081, {
  pingInterval: 3000,
  pingTimeout: 10000,
  path: '/ws',
})*/
@WebSocketGateway(8083, {
  pingInterval: 3000,
  pingTimeout: 10000,
  path: '/ws',
  transport: ['websocket'],
})
export class WssGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  wss;
  public server: io.Server;

  constructor(private readonly logger: LoggerService) {}

  private getClientQuery(client: io.Socket): { [key: string]: string } {
    return client.handshake.query as { [key: string]: string };
  }

  public broadcastAll(event_name: string, message: Record<string, unknown>) {
    this.server.emit(event_name, message);
  }

  handleConnection(client: io.Socket) {
    client.join('msgRoom');
    const { user_id } = this.getClientQuery(client);

    this.logger.info(`WssGateway: handleConnection ${user_id}`);

    return this.broadcastAll('event', { connected: user_id });
  }

  handleDisconnect(client: io.Socket) {
    const { user_id } = this.getClientQuery(client);

    this.logger.info(`WssGateway: handleDisconnect ${user_id}`);

    return this.broadcastAll('event', { disconnected: user_id });
  }

  @SubscribeMessage('send_message')
  listenForMessages(@MessageBody() content: string, @ConnectedSocket() socket: Socket) {
    const { user_id } = this.getClientQuery(socket);

    this.server.sockets.emit('receive_message', {
      content,
      user_id,
    });
  }
}
