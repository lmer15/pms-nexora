import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent local cache to reduce reads
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    // Cache size: 100MB (default is 40MB)
    cacheSizeBytes: 100 * 1024 * 1024
  })
});

export const realtimeDb = getDatabase(app);

auth.settings = {
  ...auth.settings,
  popupRedirectResolver: undefined
};

// Configure email action settings to use our custom verification page
auth.settings.appVerificationDisabledForTesting = false;

export default app;
