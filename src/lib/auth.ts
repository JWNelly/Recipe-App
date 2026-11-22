import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

// Firebase error codes → messages worth showing on the sign-in screen.
const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

function friendlyError(err: unknown): Error {
  const code = (err as { code?: string }).code;
  return new Error((code && AUTH_ERRORS[code]) || (err as Error).message || 'Authentication failed.');
}

/** Creates the account and signs the user in. */
export async function signUp(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    throw friendlyError(err);
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    throw friendlyError(err);
  }
}

export async function signOut() {
  await fbSignOut(auth);
}

/** Subscribe to auth changes. Returns an unsubscribe fn.
 *
 * Fires once on page load with the restored user (or null), then on every
 * sign-in / sign-out. Background token refreshes do not trigger it.
 */
export function onAuthChange(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}
