import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    adminApp = initializeApp({
      credential: cert(credentials),
    });
  } else {
    // Falls back to ADC if available (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    adminApp = initializeApp();
  }
} else {
  adminApp = getApps()[0]!;
}

export const adminAuth = getAuth(adminApp);


