import { Injectable, Logger, Inject } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { Prisma } from '@prisma/client';
import { NotificationPayload } from './interfaces/notification-payload.interface';
import { SubscriptionRecord, isWebKeys, isFcmKeys } from './interfaces/subscription-record.interface';
import { WEB_PUSH } from './providers/webpush.provider';
import { FIREBASE_ADMIN } from './providers/firebase.provider';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { MassNotificationDto } from './dto/mass-notification.dto';
import webpush, { WebPushError } from 'web-push';
import admin from 'firebase-admin';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class NotificationsService {
  //private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(WEB_PUSH) private readonly webPush: typeof webpush,
    @Inject(FIREBASE_ADMIN) private readonly firebase: typeof admin,
    private readonly logger: LoggerService
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
    this.logger.info(`Sending notification to subscription ${subscription.id} (type: ${subscription.type})`);
    this.logger.info(`Subscription endpoint: ${subscription.endpoint}`);
    this.logger.info(`Notification payload: ${JSON.stringify(notificationPayload)}`);

    try {
      if (subscription.type === 'web') {
        this.logger.info(`Processing web push notification for subscription ${subscription.id}`);
        if (!isWebKeys(subscription.keys)) {
          throw new Error(`Invalid keys for web subscription: ${JSON.stringify(subscription.keys)}`);
        }
        this.logger.info(`Web push keys are valid for subscription ${subscription.id}`);
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
        this.logger.info(`Web push notification sent successfully for subscription ${subscription.id}`);
      } else if (subscription.type === 'fcm') {
        this.logger.info(`Processing FCM notification for subscription ${subscription.id}`);
        if (!isFcmKeys(subscription.keys)) {
          throw new Error(`Invalid keys for FCM subscription: ${JSON.stringify(subscription.keys)}`);
        }
        this.logger.info(
          `FCM keys are valid for subscription ${subscription.id}. Token: ${(subscription.keys as any).token}`
        );

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
        this.logger.info(`FCM message payload: ${JSON.stringify(message)}`);

        const response = await this.firebase.messaging().send(message);
        this.logger.info(
          `FCM notification sent successfully for subscription ${subscription.id}. Response: ${response}`
        );
      } else {
        this.logger.warn(
          `Unknown subscription type: ${(subscription as any).type} for subscription ${(subscription as any).id}`
        );
      }
    } catch (error: any) {
      this.logger.error(`Error sending notification to subscription ${subscription.id}:`, error);
      await this.handleSendError(subscription, error);
    }
  }

  private async handleSendError(subscription: SubscriptionRecord, error: any) {
    if (subscription.type === 'web' && error instanceof WebPushError) {
      if (error.statusCode === 410) {
        await this.db.subscription.delete({ where: { id: subscription.id } });
        this.logger.info(`Removed expired web subscription id=${subscription.id}`);
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
        this.logger.info(`Removed invalid FCM subscription id=${subscription.id}`);
      } else {
        this.logger.warn(`FCM send failed (id=${subscription.id}): ${error?.code || error}`);
      }
      return;
    }
    this.logger.error(`Unhandled notification send error (id=${subscription.id}):`, error?.stack || error);
  }

  async sendMassNotification(dto: MassNotificationDto) {
    this.logger.info(`Starting mass notification process`);
    this.logger.info(`Mass notification DTO: ${JSON.stringify(dto)}`);

    const subscriptions = await this.listSubscriptions();
    this.logger.info(`Found ${subscriptions.length} subscriptions in database`);
    this.logger.info(
      `Subscriptions details:`,
      subscriptions.map((sub) => ({
        id: sub.id,
        type: sub.type,
        endpoint: sub.endpoint,
        hasValidKeys: sub.type === 'fcm' ? isFcmKeys(sub.keys) : isWebKeys(sub.keys),
      }))
    );

    const payload: NotificationPayload = {
      title: dto.title,
      body: dto.body,
      url: dto.url,
      icon: dto.icon || 'https://new.codebuilder.org/images/logo2.png',
      badge: dto.badge || 'https://new.codebuilder.org/images/logo2.png',
    };

    this.logger.info(`Prepared notification payload: ${JSON.stringify(payload)}`);

    try {
      const results = await Promise.allSettled(subscriptions.map((sub) => this.sendNotification(sub, payload)));
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.info(
        `Mass notification completed: ${successful} successful, ${failed} failed out of ${subscriptions.length} total`
      );

      if (failed > 0) {
        const failures = results
          .map((result, index) => (result.status === 'rejected' ? { index, reason: result.reason } : null))
          .filter(Boolean);
        this.logger.warn(`Failed notifications:`, failures);
      }

      return { success: true, count: subscriptions.length, successful, failed };
    } catch (error) {
      this.logger.error(`Error in mass notification process:`, error);
      throw error;
    }
  }
}
