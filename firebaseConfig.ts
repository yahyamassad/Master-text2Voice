import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// =================================================================================
// CLIENT-SIDE FIREBASE CONFIGURATION (for the Browser)
// =================================================================================
// This file configures Firebase for the user's browser (the client).
// It MUST use environment variables prefixed with `VITE_` (e.g., `VITE_FIREBASE_PROJECT_ID`).
// These variables are made available by the Vite build tool.
//
// IMPORTANT: These variables MUST point to the SAME Firebase project as the
// server-side configuration in `api/feedback.ts` to ensure that authentication,
// user history, and feedback all work together seamlessly.
// =================================================================================

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;

/**
 * A lazy-initialized singleton function to get Firebase instances.
 * This prevents the app from crashing on startup if Firebase config is missing.
 * Initialization is attempted only once, when this function is first called.
 * It now returns the app instance for explicit service initialization.
 */
function getFirebase() {
    if (!initializationAttempted) {
        initializationAttempted = true; // Mark that we are trying to initialize, even if it fails
        
        try {
            // Vite exposes env variables via import.meta.env on the client.
            // This check is crucial. If the VITE_ prefixed variables are missing,
            // it means Firebase is not configured for the client-side.
            if (typeof import.meta.env === 'undefined' || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
                isFirebaseConfigured = false;
                app = null;
                db = null;
                return { app, db, isFirebaseConfigured };
            }

            const firebaseConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID,
                measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
            };

            // A projectId and apiKey are the minimum required for initialization.
            const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

            if (hasSufficientConfig) {
                if (!getApps().length) {
                    app = initializeApp(firebaseConfig);
                } else {
                    app = getApps()[0];
                }
                db = getFirestore(app);
                isFirebaseConfigured = true;
            } else {
                 isFirebaseConfigured = false;
            }
        } catch (error) {
            console.error("Could not read client-side Firebase environment variables or initialize Firebase:", error);
            // Ensure state is clean on failure
            app = null;
            db = null;
            isFirebaseConfigured = false;
        }
    }
    return { app, db, isFirebaseConfigured };
}

// Export the function instead of the direct variables
export { getFirebase };

// Export the function instead of the direct variables
export { getFirebase };
