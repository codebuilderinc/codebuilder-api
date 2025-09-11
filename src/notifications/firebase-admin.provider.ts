import { Provider } from '@nestjs/common';
import admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

export const FirebaseAdminProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useFactory: () => {
    if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
        });
      } catch (err) {
        console.error('Failed to initialize Firebase Admin:', err);
      }
    }
    return admin;
  },
};
