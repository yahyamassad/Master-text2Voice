import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: any = null;
let isFirebaseConfigured = false;

console.log("🔥 Sawtli Firebase ENV Check:", {
  API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
});

function getFirebase() {
  try {
    // تأكد من وجود إعدادات Firebase من بيئة Vite
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      console.warn("Firebase config missing in environment variables.");
      isFirebaseConfigured = false;
      return { app, db, auth, isFirebaseConfigured };
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

    // تهيئة Firebase مرة واحدة فقط
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = null;
    db = null;
    auth = null;
    isFirebaseConfigured = false;
  }

  return { app, db, auth, isFirebaseConfigured };
}

export { getFirebase, isFirebaseConfigured, auth };
