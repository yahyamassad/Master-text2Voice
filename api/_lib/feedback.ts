import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// UNIFIED CONFIG: This now uses the same VITE_FIREBASE variables as the main app.
// This simplifies setup for the app owner to a single set of environment variables.
const mainFirebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Check if the system is configured by verifying the presence of essential variables.
const isConfigured = mainFirebaseConfig.apiKey && mainFirebaseConfig.projectId;

let mainApp: FirebaseApp;

// Initialize the main Firebase app (if configured and not already initialized).
// We can reuse the main app instance since the configs are now the same.
if (isConfigured) {
    if (!getApps().length) {
        mainApp = initializeApp(mainFirebaseConfig);
    } else {
        mainApp = getApps()[0]; // Use the already initialized main app
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // If the server-side environment variables are missing, inform the client.
    if (!isConfigured) {
        return res.status(200).json({ 
            configured: false, 
            message: 'Firebase system is not configured. Please set VITE_FIREBASE_* environment variables in Vercel.' 
        });
    }

    const db = getFirestore(mainApp);

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
