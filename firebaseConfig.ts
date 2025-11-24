
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// State holders
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let isFirebaseConfigured = false;

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================
// To HARDCODE your keys (bypass Vercel Env Vars), replace the process.env or 
// import.meta.env values below with your actual strings like "AIzaSy..."
// ============================================================================

const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

// Initialization function
const initializeFirebase = () => {
    if (app) return;

    console.log("Initializing Firebase...");

    // Basic validation to ensure we don't crash if keys are empty strings
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn("Firebase Config Missing. Please check Vercel Env Vars or Hardcode in firebaseConfig.ts");
        return;
    }

    try {
        if (!getApps().length) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }
        
        db = getFirestore(app);
        auth = getAuth(app);
        isFirebaseConfigured = true;
        console.log("Firebase Initialized Successfully");
    } catch (error) {
        console.error("Firebase initialization FAILED:", error);
        // Reset on failure
        app = undefined;
        db = undefined;
        auth = undefined;
        isFirebaseConfigured = false;
    }
};

// Attempt immediate initialization
initializeFirebase();

export const getFirebase = () => {
  // Retry initialization if it failed or hasn't run
  if (!app || !isFirebaseConfigured) {
      initializeFirebase();
  }
  return { app, db, auth, isFirebaseConfigured };
};

export { app, db, auth, isFirebaseConfigured };
// Re-export types
export type { Auth };
export type { Firestore };
