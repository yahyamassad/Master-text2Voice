
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// ============================================================================
// FIREBASE CONFIGURATION - HARDCODED (FIXED FOR VERCEL)
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyChk5lI5nEZHy4IMc1xDh51wVTpL0__7Uo",
    authDomain: "master-text2voice.firebaseapp.com",
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
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    
    // Initialize Compat Services
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseConfigured = true;
    
    console.log("Firebase Initialized Successfully (Compat Mode)");
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export const getFirebase = () => {
    return { app, auth, db, isFirebaseConfigured };
};

export { app, auth, db, isFirebaseConfigured };
export default firebase;
