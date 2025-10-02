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

        const tryParse = (raw: string | undefined): any | null => {
          if (!raw) return null;
          let s = raw.trim();
          // Strip surrounding single/double quotes
          if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
            s = s.slice(1, -1);
          }
          // Unescape newline sequences often present when JSON is stored in env vars
          s = s.replace(/\\n/g, '\n');

          // If it looks like JSON, try parsing directly
          if (s.startsWith('{') || s.startsWith('[')) {
            try {
              return JSON.parse(s);
            } catch (err) {
              // continue to other attempts
            }
          }

          // Try base64 decode (common when storing secrets in environment variables)
          try {
            const decoded = Buffer.from(s, 'base64').toString('utf8');
            if (decoded && (decoded.trim().startsWith('{') || decoded.trim().startsWith('['))) {
              try {
                return JSON.parse(decoded);
              } catch (err) {
                // fallthrough
              }
            }
          } catch (_) {
            // not base64 or failed decode
          }

          return null;
        };

        if (envKey) {
          const parsed = tryParse(envKey);
          if (parsed) {
            credentialObj = parsed;
          } else {
            console.error('[FirebaseProvider] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON. Sample (truncated):',
              String(envKey).slice(0, 200) + (String(envKey).length > 200 ? '...[truncated]' : '')
            );
          }
        } else if (envPath) {
          try {
            const file = fs.readFileSync(String(envPath), 'utf8');
            const parsed = tryParse(file) ?? tryParse(file.replace(/\\n/g, '\n'));
            if (parsed) {
              credentialObj = parsed;
            } else {
              console.error('[FirebaseProvider] Service account file content is not valid JSON:', String(envPath));
            }
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
