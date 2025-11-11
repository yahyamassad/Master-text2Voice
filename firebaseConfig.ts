import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// الحالة العامة
let app: any = null;
let db: any = null;
let auth: any = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;

export function getFirebase() {
  if (!initializationAttempted) {
    initializationAttempted = true;

    try {
      const env = import.meta.env;
      if (!env?.VITE_FIREBASE_PROJECT_ID || !env?.VITE_FIREBASE_API_KEY) {
        console.warn("Firebase config not found");
        isFirebaseConfigured = false;
        return { app, db, auth, isFirebaseConfigured };
      }

      const firebaseConfig = {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApps()[0];
      }

      db = getFirestore(app);
      auth = getAuth(app);
      isFirebaseConfigured = true;
    } catch (e) {
      console.error("Firebase init error:", e);
      isFirebaseConfigured = false;
    }
  }

  return { app, db, auth, isFirebaseConfigured };
}

// ✅ التصدير المباشر المطلوب في App.tsx
export { isFirebaseConfigured, auth };
