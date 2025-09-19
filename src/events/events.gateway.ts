import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';

/*
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
*/

// WebSocket gateway for events - updated port to 8084
@WebSocketGateway(8084, {
  path: '/ws',
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private getClientQuery(client: Socket): Record<string, unknown> {
    return client.handshake.query;
  }

  public broadcastAll(event_name: string, message: Record<string, unknown>) {
    this.server.emit(event_name, message);
  }

  public handleConnection(client: Socket) {
    const { user_id } = this.getClientQuery(client);
    
    console.log('WssGateway: handleConnection', { user_id });

    return this.broadcastAll('event', { connected: user_id });
  }

  public handleDisconnect(client: Socket) {
    const { user_id } = this.getClientQuery(client);

    console.log('WssGateway: handleDisconnect', { user_id });

    return this.broadcastAll('event', { disconnected: user_id });
  }

  @SubscribeMessage('tick')
  handleEvent(@MessageBody() data: unknown, @ConnectedSocket() client: Socket): WsResponse<unknown> {
    const event = 'events';
    return { event, data };
  }

  @SubscribeMessage('tick')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })));
  }

  @SubscribeMessage('identity')
  identity(@MessageBody() data: number): number {
    return data;
  }
}
