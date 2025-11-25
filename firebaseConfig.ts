
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

// Determine the Auth Domain dynamically.
// If we are on the custom domain (sawtli.com), use it as the auth handler
// to prevent the popup from showing 'firebaseapp.com' or 'vercel.app'.
// This works because of the 'rewrites' rule in vercel.json.
const isProd = typeof window !== 'undefined' && window.location.hostname.includes('sawtli');
// Fallback to firebaseapp.com directly to avoid any Vercel proxy issues for now
const calculatedAuthDomain = "master-text2voice.firebaseapp.com";

const firebaseConfig = {
    apiKey: "AIzaSyChk5lI5nEZHy4IMc1xDh51wVTpL0__7Uo",
    authDomain: calculatedAuthDomain,
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
    
    console.log(`Firebase Initialized. Auth Domain: ${firebaseConfig.authDomain}`);
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export const getFirebase = () => {
    return { app, auth, db, isFirebaseConfigured };
};

export { app, auth, db, isFirebaseConfigured };
export default firebase;
