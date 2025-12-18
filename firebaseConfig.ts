
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "", 
    authDomain: "www.sawtli.com", // هذا السطر سيجعل اسم النطاق يظهر بدلاً من firebaseapp
    projectId: "master-text2voice",
    storageBucket: "master-text2voice.firebasestorage.app",
    messagingSenderId: "390050145859",
    appId: "1:390050145859:web:2013fd0bfc352d060956f6",
    measurementId: "G-0BWE7XEESG"
};

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let isFirebaseConfigured = false;

try {
    if (firebaseConfig.apiKey) {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        isFirebaseConfigured = true;
    }
} catch (error) {
    console.error("Firebase Init Error:", error);
}

export const getFirebase = () => ({ app, auth, db, isFirebaseConfigured });
export { app, auth, db, isFirebaseConfigured };
export default firebase;
