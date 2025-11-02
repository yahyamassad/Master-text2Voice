// FIX: Switched to Firebase v8 compat imports to resolve module resolution errors.
// This is necessary when the installed Firebase SDK version is v8, not v9+.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في منصة النشر الخاصة بك
// =================================================================================

let app: firebase.app.App | null = null;
let db: firebase.firestore.Firestore | null = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;


/**
 * A lazy-initialized singleton function to get the Firestore instance.
 * This prevents the app from crashing on startup if Firebase config is missing.
 * Initialization is attempted only once, when this function is first called.
 * CRITICAL FIX: Added a guard to safely handle environments where `process.env`
 * is not defined, preventing a fatal application crash.
 */
function getFirebase() {
    if (!initializationAttempted) {
        initializationAttempted = true; // Mark that we are trying to initialize, even if it fails

        // Safely access environment variables, providing an empty object as a fallback
        // to prevent `TypeError: cannot read properties of undefined`.
        const env = (typeof process !== 'undefined' && process.env) ? process.env : {};

        const firebaseConfig = {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: env.VITE_FIREBASE_APP_ID,
            measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
        };

        const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

        if (hasSufficientConfig) {
            try {
                // FIX: Use v8 compat initialization methods.
                app = firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                isFirebaseConfigured = true;
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                // In case of error, ensure variables remain null/false
                db = null;
                isFirebaseConfigured = false;
            }
        }
    }
    return { db, isFirebaseConfigured };
}

// Export the function instead of the direct variables
export { getFirebase };