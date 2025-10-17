import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في Vercel
// =================================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// يتحقق هذا المتغير مما إذا كانت متغيرات البيئة قد تم إعدادها
export const isFirebaseConfigured = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;

// تهيئة Firebase
// ملاحظة: سيتم تهيئة التطبيق حتى لو كانت البيانات غير صحيحة،
// ولكن أي استدعاء لقاعدة البيانات سيفشل.
// يتم التعامل مع هذا في مكون Feedback.
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;