import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasClientConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app = null;
let db = null;
let auth = null;

if (hasClientConfig()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else if (import.meta.env.DEV) {
  console.warn(
    "[firebase] Client SDK not initialized — missing VITE_FIREBASE_* env vars"
  );
}

export { db, auth };

/**
 * Sign in anonymously so every session has a unique ID for feedback tracking.
 * Returns the Firebase Auth uid, or null if Firebase is not configured.
 */
export async function initSession() {
  if (!auth) {
    return null;
  }
  const result = await signInAnonymously(auth);
  return result.user.uid;
}
