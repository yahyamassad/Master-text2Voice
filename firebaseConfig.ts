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
 */
function getFirebase() {
    if (!initializationAttempted) {
        initializationAttempted = true; // Mark that we are trying to initialize, even if it fails

        // FIX: Switched from `import.meta.env` to `process.env` to resolve TypeScript errors.
        // The `process.env` variables are defined in `vite.config.ts`.
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
