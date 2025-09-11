import { Subscription, Prisma } from '@prisma/client';

export interface WebSubscription extends Subscription {
  type: 'web';
  keys: Prisma.JsonValue;
}

export interface FcmSubscription extends Subscription {
  type: 'fcm';
  keys: Prisma.JsonValue;
}

export type SubscriptionRecord = WebSubscription | FcmSubscription;

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
