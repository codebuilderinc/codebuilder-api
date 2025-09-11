import { Injectable, Logger, Inject } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { Prisma } from '@prisma/client';
import { NotificationPayload } from './interfaces/notification-payload.interface';
import { SubscriptionRecord, isWebKeys, isFcmKeys } from './interfaces/subscription-record.interface';
import { WEB_PUSH } from './webpush.provider';
import { FIREBASE_ADMIN } from './firebase-admin.provider';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { MassNotificationDto } from './dto/mass-notification.dto';
import webpush, { WebPushError } from 'web-push';
import admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(WEB_PUSH) private readonly webPush: typeof webpush,
    @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin
  ) {}

  getPublicKey(): string | undefined {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }

  async upsertSubscription(dto: CreateSubscriptionDto, ipAddress: string) {
    if (dto.type === 'web' && (!dto.keys.p256dh || !dto.keys.auth)) {
      throw new Error('Invalid web-push subscription data: missing keys.');
    }
    if (dto.type === 'fcm' && !dto.keys.token) {
      throw new Error('Invalid FCM subscription data: missing token.');
    }

    const existing = await this.db.subscription.findFirst({
      where: { endpoint: dto.endpoint, type: dto.type },
    });

    let record;
    if (existing) {
      record = await this.db.subscription.update({
        where: { id: existing.id },
        data: { keys: dto.keys as unknown as Prisma.JsonValue, ipAddress },
      });
    } else {
      record = await this.db.subscription.create({
        data: {
          endpoint: dto.endpoint,
          type: dto.type as any,
          ipAddress,
          keys: dto.keys as unknown as Prisma.JsonValue,
        },
      });
    }
    return record;
  }

  async listSubscriptions(): Promise<SubscriptionRecord[]> {
    return (await this.db.subscription.findMany()) as SubscriptionRecord[];
  }

  async sendNotification(subscription: SubscriptionRecord, notificationPayload: NotificationPayload): Promise<void> {
    try {
      if (subscription.type === 'web') {
        if (!isWebKeys(subscription.keys)) {
          throw new Error(`Invalid keys for web subscription: ${JSON.stringify(subscription.keys)}`);
        }
        await this.webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: (subscription.keys as any).auth,
              p256dh: (subscription.keys as any).p256dh,
            },
          },
          JSON.stringify(notificationPayload)
        );
      } else if (subscription.type === 'fcm') {
        if (!isFcmKeys(subscription.keys)) {
          throw new Error(`Invalid keys for FCM subscription: ${JSON.stringify(subscription.keys)}`);
        }
        const message = {
          notification: {
            title: notificationPayload.title,
            body: notificationPayload.body,
          },
          data: {
            url: notificationPayload.url,
          },
          token: (subscription.keys as any).token,
          android: {
            notification: {
              sound: 'notification',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'notification',
              },
            },
          },
        };
        const response = await this.firebase.messaging().send(message);
        this.logger.log(`FCM response: ${response}`);
      }
    } catch (error: any) {
      await this.handleSendError(subscription, error);
    }
  }

  private async handleSendError(subscription: SubscriptionRecord, error: any) {
    if (subscription.type === 'web' && error instanceof WebPushError) {
      if (error.statusCode === 410) {
        await this.db.subscription.delete({ where: { id: subscription.id } });
        this.logger.log(`Removed expired web subscription id=${subscription.id}`);
      } else {
        this.logger.warn(`Web push send failed (id=${subscription.id}): ${error.statusCode} ${error.body}`);
      }
      return;
    }
    if (subscription.type === 'fcm') {
      if (
        error?.code === 'messaging/invalid-registration-token' ||
        error?.code === 'messaging/registration-token-not-registered'
      ) {
        await this.db.subscription.delete({ where: { id: subscription.id } });
        this.logger.log(`Removed invalid FCM subscription id=${subscription.id}`);
      } else {
        this.logger.warn(`FCM send failed (id=${subscription.id}): ${error?.code || error}`);
      }
      return;
    }
    this.logger.error(`Unhandled notification send error (id=${subscription.id}):`, error?.stack || error);
  }

  async sendMassNotification(dto: MassNotificationDto) {
    const subscriptions = await this.listSubscriptions();
    this.logger.log(`Subscriptions`, subscriptions);

    const payload: NotificationPayload = {
      title: dto.title,
      body: dto.body,
      url: dto.url,
      icon: dto.icon || 'https://new.codebuilder.org/images/logo2.png',
      badge: dto.badge || 'https://new.codebuilder.org/images/logo2.png',
    };
    await Promise.all(subscriptions.map((sub) => this.sendNotification(sub, payload)));
    return { success: true, count: subscriptions.length };
  }
}
