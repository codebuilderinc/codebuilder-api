import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import webpush, { WebPushError } from 'web-push';
import admin from 'firebase-admin';
import { Subscription } from '@prisma/client';
import { Prisma } from '@prisma/client';

// VAPID keys should be set via environment variables
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
}

export interface WebSubscription extends Subscription {
  type: 'web';
  keys: Prisma.JsonValue;
}

export interface FcmSubscription extends Subscription {
  type: 'fcm';
  keys: Prisma.JsonValue;
}

export type SubscriptionRecord = WebSubscription | FcmSubscription;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly db: DatabaseService) {}

  async sendNotification(subscription: SubscriptionRecord, notificationPayload: NotificationPayload): Promise<void> {
    try {
      this.logger.log('Sending notification to subscription:', subscription);

      if (subscription.type === 'web') {
        if (!isWebKeys(subscription.keys)) {
          throw new Error(`Invalid keys for web subscription: ${JSON.stringify(subscription.keys)}`);
        }
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: (subscription.keys as any).auth,
              p256dh: (subscription.keys as any).p256dh,
            },
          },
          JSON.stringify({
            title: notificationPayload.title,
            body: notificationPayload.body,
            icon: notificationPayload.icon,
            badge: notificationPayload.badge,
            url: notificationPayload.url,
          })
        );
      } else if (subscription.type === 'fcm') {
        if (!isFcmKeys(subscription.keys)) {
          throw new Error(`Invalid keys for FCM subscription: ${JSON.stringify(subscription.keys)}`);
        }
        const fcmMessage = {
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
        const response = await admin.messaging().send(fcmMessage);
        this.logger.log('FCM response:', response);
      }
    } catch (error: any) {
      if (subscription.type === 'web' && error instanceof WebPushError) {
        if (error.statusCode === 410) {
          await this.db.subscription.delete({ where: { id: subscription.id } });
          this.logger.log(`Subscription with id ${subscription.id} removed due to expiration.`);
        } else {
          this.logger.log(
            `Failed to send notification to subscription id ${subscription.id}:`,
            error.statusCode,
            error.body
          );
        }
      } else if (subscription.type === 'fcm') {
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          await this.db.subscription.delete({ where: { id: subscription.id } });
          this.logger.log(`Removed invalid FCM token for subscription id ${subscription.id}.`);
        } else {
          this.logger.log(`Failed to send FCM notification to subscription id ${subscription.id}:`, error);
        }
      } else {
        this.logger.log(`An error occurred while sending notification to subscription id ${subscription.id}:`, error);
      }
    }
  }
}

export function isWebKeys(keys: Prisma.JsonValue): keys is { auth: string; p256dh: string } {
  return (
    typeof keys === 'object' &&
    keys !== null &&
    'auth' in keys &&
    'p256dh' in keys &&
    typeof (keys as any).auth === 'string' &&
    typeof (keys as any).p256dh === 'string'
  );
}

export function isFcmKeys(keys: Prisma.JsonValue): keys is { token: string } {
  return typeof keys === 'object' && keys !== null && 'token' in keys && typeof (keys as any).token === 'string';
}
