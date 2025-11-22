
// Fix: Use Firebase v8 'firebase/app' import for compatibility.
// FIX: Use compat libraries for Firebase v9 with v8 syntax.
import firebase from 'firebase/compat/app';
// Fix: Import firestore and auth for their side-effects to initialize the services.
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// Fix: Define types based on the Firebase v8 SDK.
type FirebaseApp = firebase.app.App;
type Firestore = firebase.firestore.Firestore;
type Auth = firebase.auth.Auth;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Safely access environment variables. In some environments (like this preview),
// `import.meta.env` might be undefined. This approach prevents a TypeError.
const env = (import.meta as any)?.env || {};

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

// Determine if the config values exist
const hasConfigValues = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

// Initialize only if config values are present
if (hasConfigValues) {
    try {
        // Fix: Use Firebase v8 initialization syntax.
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        db = app.firestore();
        auth = app.auth();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Ensure state is clean on failure
        app = null;
        db = null;
        auth = null;
    }
}

// The final status depends on whether the app object was successfully created.
const isFirebaseConfigured = !!app;

export const getFirebase = () => {
  return { app, db, auth, isFirebaseConfigured };
};

export { app, db, auth, isFirebaseConfigured };
