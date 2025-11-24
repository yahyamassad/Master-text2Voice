
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import * as firestore from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// State holders
let app: FirebaseApp | undefined;
let db: firestore.Firestore | undefined;
let auth: Auth | undefined;
let isFirebaseConfigured = false;

// Safe environment variable accessor
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        // Use optional chaining to prevent crashes if import.meta or env is undefined
        const val = (import.meta?.env?.[key]) || '';
        if (!val) console.warn(`Firebase Init: Missing ${key}`);
        return val;
    } catch (e) {
        console.warn(`Error accessing env var ${key}`, e);
        return '';
    }
};

// Initialization function
const initializeFirebase = () => {
    // If already initialized, don't do it again
    if (app) return;

    console.log("Initializing Firebase Client...");

    const apiKey = getEnv('VITE_FIREBASE_API_KEY');
    const projectId = getEnv('VITE_FIREBASE_PROJECT_ID');

    const firebaseConfig = {
        apiKey: apiKey,
        authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: projectId,
        storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
        appId: getEnv('VITE_FIREBASE_APP_ID'),
    };

    // Only verify essential keys
    const hasConfigValues = !!(projectId && apiKey);

    if (hasConfigValues) {
        try {
            if (!getApps().length) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApp();
            }
            
            db = firestore.getFirestore(app);
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
    } else {
        // Quiet failure if config is missing (expected for new setup)
        console.warn("Firebase Config Missing - Initialization Skipped. Please Redeploy Vercel to bake in Env Vars.");
    }
};

// Attempt immediate initialization
initializeFirebase();

export const getFirebase = () => {
  // LAZY INIT: Try to initialize again if it failed previously. 
  // This fixes the "Loop" issue where env vars might be read too early.
  if (!app || !isFirebaseConfigured) {
      initializeFirebase();
  }
  return { app, db, auth, isFirebaseConfigured };
};

export { app, db, auth, isFirebaseConfigured };
// Re-export types safely
export type { Auth };
export type Firestore = firestore.Firestore;
