// FIX: The `/// <reference types="vite/client" />` directive was removed because it caused a build error
// in environments where TypeScript cannot locate the type definition file.
// The manual type definitions below serve as a robust fallback to ensure `import.meta.env` is typed correctly.

// Fix: Manually define types for import.meta.env as a workaround for environments
// where `vite/client` types might not be automatically recognized. This resolves
// TypeScript errors about `import.meta.env` properties being undefined.
// Wrapping in `declare global` makes the augmentation more robust in a modular context.
declare global {
  // FIX: To resolve the type conflict with Vite's client types, we augment the existing
  // `ImportMetaEnv` interface instead of redeclaring the `ImportMeta` interface. This is
  // the standard way to type environment variables in Vite.
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    // FIX: Corrected typo in environment variable name from VITE_FIREB ASE_PROJECT_ID to VITE_FIREBASE_PROJECT_ID.
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  }

  // FIX: Since the reference to "vite/client" may not be resolving in all environments,
  // we are manually defining `ImportMeta` to ensure `import.meta.env` is typed.
  // This resolves errors about property 'env' not existing and can fix cascading
  // module resolution issues with other libraries like Firebase.
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// FIX: Corrected Firebase imports to use the modern v9+ modular API,
// resolving the critical runtime error that caused a blank screen.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';


// =================================================================================
// قراءة إعدادات Firebase من متغيرات البيئة الآمنة بدلاً من كتابتها هنا مباشرة
// يجب إضافة هذه المتغيرات في منصة النشر الخاصة بك
// =================================================================================

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

// FIX: All TypeScript errors related to env variables are fixed here.
// By explicitly typing `env` as `Partial<ImportMeta['env']>`, we inform TypeScript that
// the environment variables are optional. This aligns with the safe check for `import.meta.env`
// and allows accessing properties on `env` even if it's an empty object at runtime.
const env: Partial<ImportMeta['env']> = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};


// يتحقق هذا المتغير مما إذا كانت متغيرات البيئة قد تم إعدادها بشكل كافٍ
const hasSufficientConfig = firebaseConfig.projectId && firebaseConfig.apiKey;

if (hasSufficientConfig) {
  try {
    // FIX: Use the v9+ modular initialization methods.
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // في حالة حدوث خطأ، ستبقى المتغيرات على قيمتها الأولية (null, false)
    // وسيتم عرض رسالة الإعداد في واجهة المستخدم
    isFirebaseConfigured = false;
  }
}

export { db, isFirebaseConfigured };
