import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في منصة النشر الخاصة بك
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
            // This check is crucial. If import.meta.env is undefined, it means we're in an
            // unexpected environment or the build is broken. We must handle this gracefully.
            if (typeof import.meta.env === 'undefined' || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
                // If the env variables are not available, it means Firebase is not configured.
                // We return the unconfigured state. The UI will then show the setup guide.
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

            // A projectId is a good indicator that the config is present.
            const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

            if (hasSufficientConfig) {
                if (!getApps().length) {
                    app = initializeApp(firebaseConfig);
                } else {
                    app = getApps()[0];
                }
                db = getFirestore(app);
                isFirebaseConfigured = true;
            }
        } catch (error) {
            console.error("Could not read Firebase environment variables or initialize Firebase:", error);
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
