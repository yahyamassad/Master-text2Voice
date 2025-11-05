import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في منصة النشر الخاصة بك
// =================================================================================

let db: Firestore | null = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;

/**
 * A lazy-initialized singleton function to get the Firestore instance.
 * This prevents the app from crashing on startup if Firebase config is missing.
 * Initialization is attempted only once, when this function is first called.
 */
function getFirebase() {
    if (!initializationAttempted) {
        initializationAttempted = true; // Mark that we are trying to initialize, even if it fails
        
        try {
            // ROBUSTNESS FIX: Read variables directly from process.env, which is populated
            // by Vite's `define` config. This is more reliable than `import.meta.env`.
            const firebaseConfig = {
                apiKey: process.env.VITE_FIREBASE_API_KEY,
                authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.VITE_FIREBASE_APP_ID,
                measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
            };

            const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

            if (hasSufficientConfig) {
                let app: FirebaseApp;
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
            db = null;
            isFirebaseConfigured = false;
        }
    }
    return { db, isFirebaseConfigured };
}

// Export the function instead of the direct variables
export { getFirebase };
