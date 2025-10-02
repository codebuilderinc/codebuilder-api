import { Provider } from '@nestjs/common';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

/**
 * Firebase Admin provider.
 *
 * Initialization strategy:
 * 1. Only use google-services.json from project root. If missing or invalid, throw error and fail startup.
 */
export const FirebaseProvider: Provider = {
  provide: FIREBASE_ADMIN,
  useFactory: () => {
  // Use process.cwd() and append '/../../google-services.json' to find project root file
  const serviceAccountPath = path.resolve(process.cwd(), '../../google-services.json');
  console.log('[FirebaseProvider] Looking for service account at:', serviceAccountPath);
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('[FirebaseProvider] google-services.json not found in project root.');
      throw new Error('google-services.json not found in project root');
    }

    try {
      const file = fs.readFileSync(serviceAccountPath, 'utf8');
      const parsed = JSON.parse(file);
      // Basic validation: service account JSON should contain a "type": "service_account"
      // or at least private_key and client_email fields required by firebase-admin.
      const looksLikeServiceAccount =
        parsed && (parsed.type === 'service_account' || (parsed.private_key && parsed.client_email));
      if (!looksLikeServiceAccount) {
        console.error(
          '[FirebaseProvider] google-services.json does not appear to be a Firebase service account:',
          serviceAccountPath
        );
        throw new Error('Invalid google-services.json: ' + serviceAccountPath);
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
        console.log('[FirebaseProvider] Initialized Firebase Admin SDK using google-services.json');
      }
    } catch (err) {
      console.error(
        '[FirebaseProvider] Failed to read/initialize Firebase Admin from google-services.json:',
        serviceAccountPath,
        err
      );
      throw err;
    }
    return admin;
  },
  inject: [],
};
