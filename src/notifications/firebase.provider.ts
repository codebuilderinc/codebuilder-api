import { Provider } from '@nestjs/common';
import admin from 'firebase-admin';
import fs from 'fs';
import { ConfigService } from '../common/configs/config.service';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

/**
 * Firebase Admin provider.
 *
 * Initialization strategy:
 * 1. Prefer FIREBASE_SERVICE_ACCOUNT_KEY (stringified JSON) from env or ConfigService
 * 2. Fallback to FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)
 * 3. If neither present, do not initialize and return the admin namespace (attempts to use it will fail with a clear log)
 */
export const FirebaseProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useFactory: (configService: ConfigService) => {
    // Prefer process.env values. If not present, attempt to read from ConfigService.getConfigs()
    let envKey: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let envPath: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if ((!envKey || !envPath) && configService) {
      const cfg = (configService as any).getConfigs?.() as Record<string, any> | undefined;
      if (cfg) {
        if (!envKey && typeof cfg.FIREBASE_SERVICE_ACCOUNT_KEY === 'string') {
          envKey = cfg.FIREBASE_SERVICE_ACCOUNT_KEY;
        }
        if (!envPath && typeof cfg.FIREBASE_SERVICE_ACCOUNT_PATH === 'string') {
          envPath = cfg.FIREBASE_SERVICE_ACCOUNT_PATH;
        }
      }
    }

    if (!admin.apps.length) {
      let credentialObj: any = null;

      if (envKey) {
        try {
          credentialObj = JSON.parse(envKey);
        } catch (err) {
          console.error('[FirebaseProvider] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON', err);
        }
      } else if (envPath) {
        try {
          const file = fs.readFileSync(String(envPath), 'utf8');
          credentialObj = JSON.parse(file);
        } catch (err) {
          console.error('[FirebaseProvider] Failed to read/parse service account at path:', String(envPath), err);
        }
      }

      if (credentialObj) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert(credentialObj),
          });
          console.log('[FirebaseProvider] Initialized Firebase Admin SDK');
        } catch (err) {
          console.error('[FirebaseProvider] Failed to initialize Firebase Admin:', err);
        }
      } else {
        console.warn(
          '[FirebaseProvider] No Firebase service account provided (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH). Firebase Admin not initialized. Calls to firebase services will fail.'
        );
      }
    }

    return admin;
  },
  inject: [ConfigService],
};
