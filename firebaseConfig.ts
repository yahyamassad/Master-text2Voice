
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

// State holders
let app: firebase.app.App | undefined;
let db: firebase.firestore.Firestore | undefined;
let auth: firebase.auth.Auth | undefined;
let isFirebaseConfigured = false;

// ============================================================================
// FIREBASE CONFIGURATION - HARDCODED
// ============================================================================
// PASTE YOUR KEYS BELOW. DO NOT COMMIT TO PUBLIC REPOS.
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

// Initialization function
const initializeFirebase = () => {
    if (app) return;

    console.log("Initializing Firebase (Hardcoded)...");

    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        
        db = app.firestore();
        auth = app.auth();
        isFirebaseConfigured = true;
        console.log("Firebase Initialized Successfully");
    } catch (error) {
        console.error("Firebase initialization FAILED:", error);
        // Reset on failure
        app = undefined;
        db = undefined;
        auth = undefined;
        isFirebaseConfigured = false;
    }
};

// Attempt immediate initialization
initializeFirebase();

export const getFirebase = () => {
  // Retry initialization if it failed or hasn't run
  if (!app || !isFirebaseConfigured) {
      initializeFirebase();
  }
  return { app, db, auth, isFirebaseConfigured };
};

export { app, db, auth, isFirebaseConfigured };
// Re-export types
export type Auth = firebase.auth.Auth;
export type Firestore = firebase.firestore.Firestore;
