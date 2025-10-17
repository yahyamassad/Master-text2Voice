import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في منصة النشر الخاصة بك
// =================================================================================

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // يتحقق هذا المتغير مما إذا كانت متغيرات البيئة قد تم إعدادها بشكل كافٍ
  const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

  if (hasSufficientConfig) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // في حالة حدوث خطأ، ستبقى المتغيرات على قيمها الأولية (null, false)
  // وسيتم عرض رسالة الإعداد في واجهة المستخدم
}

export { db, isFirebaseConfigured };
