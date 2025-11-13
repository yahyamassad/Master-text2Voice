import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: any = null;
let isFirebaseConfigured = false;
let initializationAttempted = false; // ✅ مفقود سابقًا

// ✅ Initialize Firebase safely (once only)
function getFirebase() {
  if (!initializationAttempted) {
    initializationAttempted = true;
    try {
      // تأكد من توفر متغيرات البيئة الخاصة بـ Vite
      if (
        typeof import.meta.env === "undefined" ||
        !import.meta.env.VITE_FIREBASE_PROJECT_ID
      ) {
        console.warn("⚠️ Firebase environment variables missing.");
        isFirebaseConfigured = false;
        app = null;
        db = null;
        auth = null;
        return { app, db, auth, isFirebaseConfigured };
      }

      // إعدادات Firebase من متغيرات البيئة
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
      console.log("✅ Firebase initialized successfully.");

    } catch (error) {
      console.error("❌ Firebase initialization failed:", error);
      app = null;
      db = null;
      auth = null;
      isFirebaseConfigured = false;
    }
  }

  return { app, db, auth, isFirebaseConfigured };
}

// ✅ Export only the function — safer and cleaner
export { getFirebase };
