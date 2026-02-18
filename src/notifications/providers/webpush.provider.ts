import { Provider } from '@nestjs/common';
import webpush from 'web-push';

export const WEB_PUSH = 'WEB_PUSH';

export const WebPushProvider: Provider = {
  provide: WEB_PUSH,
  useFactory: () => {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
    return webpush;
  },
};
