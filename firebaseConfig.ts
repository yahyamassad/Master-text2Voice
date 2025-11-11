// =================================================================================
// Firebase Configuration - Final Stable Version (Vite + Rollup + Vercel Compatible)
// =================================================================================

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// -----------------------------------------------------
// Global module-level variables
// -----------------------------------------------------
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: any = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;

// -----------------------------------------------------
// Safe initialization function
// -----------------------------------------------------
export function getFirebase() {
  if (!initializationAttempted) {
    initializationAttempted = true;

    try {
      if (
        typeof import.meta.env === "undefined" ||
        !import.meta.env.VITE_FIREBASE_PROJECT_ID
      ) {
        console.warn("⚠️ Firebase environment variables missing.");
        isFirebaseConfigured = false;
        return { app: null, db: null, isFirebaseConfigured };
      }

      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };

      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        if (!getApps().length) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApps()[0];
        }
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseConfigured = true;
      } else {
        isFirebaseConfigured = false;
      }
    } catch (error) {
      console.error("❌ Firebase init failed:", error);
      isFirebaseConfigured = false;
      app = null;
      db = null;
    }
  }

  return { app, db, auth, isFirebaseConfigured };
}

// -----------------------------------------------------
// ✅ Export constants for App.tsx
// -----------------------------------------------------
export { app, db, auth, isFirebaseConfigured };
