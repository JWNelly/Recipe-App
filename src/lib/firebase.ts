import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
  throw new Error(
    'Missing Firebase config. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ' +
      'VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID in your .env file.'
  );
}

const app = initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app);

/** UID of the signed-in user, or throws. */
export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in.');
  return uid;
}
