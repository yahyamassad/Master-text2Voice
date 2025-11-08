import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// SERVER-SIDE CONFIG: This must use environment variables WITHOUT the VITE_ prefix.
// The user needs to set these in their Vercel project settings. They will be available
// to the serverless functions, but not to the client-side code.
const serverFirebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

// Check if the system is configured by verifying the presence of essential variables.
const isConfigured = serverFirebaseConfig.apiKey && serverFirebaseConfig.projectId;

let firebaseApp: FirebaseApp;

// Initialize the Firebase app for the serverless function environment.
if (isConfigured) {
    // Use a unique name to avoid conflicts in serverless environments
    const appName = 'Sawtli-Feedback-API';
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        firebaseApp = existingApp;
    } else {
        firebaseApp = initializeApp(serverFirebaseConfig, appName);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // If the server-side environment variables are missing, inform the client.
    if (!isConfigured) {
        return res.status(200).json({ 
            configured: false, 
            message: 'Firebase system is not configured for the API. Please set FIREBASE_* environment variables in Vercel.' 
        });
    }

    const db = getFirestore(firebaseApp);

    if (req.method === 'GET') {
        try {
            const feedbackCollectionRef = collection(db, 'feedback');
            const q = query(feedbackCollectionRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const feedbacks = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to a serializable format (milliseconds) for the client.
                    createdAt: (data.createdAt as Timestamp)?.toMillis() || null,
                };
            });
            
            return res.status(200).json({ configured: true, feedbacks });
        } catch (error: any) {
            console.error('Error fetching feedback:', error);
            let userMessage = 'Failed to fetch feedback. Please check server logs for details.';
            if (error.code === 'permission-denied') {
                userMessage = 'Failed to fetch feedback due to a permission error. Please verify that your Firestore security rules (Step 4) allow read access to the "feedback" collection.';
            } else if (error.code === 'failed-precondition' || (error.message && error.message.toLowerCase().includes('database'))) {
                userMessage = 'Failed to connect to the database to fetch feedback. Please ensure you have created a Firestore Database in your Firebase project (Step 2 of the setup guide).';
            }
            return res.status(500).json({ error: userMessage });
        }
    }

    if (req.method === 'POST') {
        try {
            const { name, comment, rating } = req.body;
            if (!comment || rating === 0) {
                return res.status(400).json({ error: 'Comment and rating are required.' });
            }

            const feedbackCollectionRef = collection(db, 'feedback');
            await addDoc(feedbackCollectionRef, {
                name: name || 'Anonymous',
                comment,
                rating,
                createdAt: serverTimestamp(),
            });

            return res.status(201).json({ success: true });
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            let userMessage = 'Failed to submit feedback. Please check server logs for details.';

            // Check for specific Firebase error codes that are common during setup
            if (error.code === 'permission-denied') {
                userMessage = 'Failed to submit feedback due to a permission error. Please verify that your Firestore security rules (Step 4) are correctly published and allow write access to the "feedback" collection.';
            } else if (error.code === 'failed-precondition' || (error.message && error.message.toLowerCase().includes('database'))) {
                // This error often indicates the database hasn't been created or initialized yet.
                userMessage = 'Failed to connect to the database. Please ensure you have created a Firestore Database in your Firebase project (Step 2 of the setup guide).';
            }
            
            return res.status(500).json({ error: userMessage });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
