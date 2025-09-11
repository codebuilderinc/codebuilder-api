import { Controller, Get, Post, Body, Ip, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { MassNotificationDto } from './dto/mass-notification.dto';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('public-key')
  @Api({
    summary: 'Get VAPID public key',
    description: 'Returns the Web Push VAPID public key for browser clients.',
    envelope: true,
    responses: [{ status: 200, description: 'Public key returned.' }],
  })
  getPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @Api({
    summary: 'Create or update push subscription',
    description: 'Stores (upserts) a Web Push or FCM subscription tied to the client.',
    bodyType: CreateSubscriptionDto,
    envelope: true,
    responses: [
      { status: 201, description: 'Subscription stored.' },
      { status: 400, description: 'Invalid subscription payload.' },
    ],
  })
  async subscribe(@Body() dto: CreateSubscriptionDto, @Ip() ip: string) {
    const record = await this.notificationsService.upsertSubscription(dto, ip || 'Unknown');
    return { message: 'Subscription stored', data: record };
  }

  @Post('mass')
  @Api({
    summary: 'Send a mass notification',
    description: 'Sends a notification to all stored subscriptions.',
    bodyType: MassNotificationDto,
    envelope: true,
    responses: [
      { status: 200, description: 'Mass notification request accepted.' },
      { status: 400, description: 'Invalid notification payload.' },
    ],
  })
  async mass(@Body() dto: MassNotificationDto) {
    return this.notificationsService.sendMassNotification(dto);
  }
}
