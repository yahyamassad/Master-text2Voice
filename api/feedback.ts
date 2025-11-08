// FIX: The Firebase Admin SDK exports the app type as 'App', not 'FirebaseApp'. Using an alias for compatibility.
import { initializeApp, getApps, App as FirebaseApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// =================================================================================
// SERVER-SIDE FIREBASE CONFIGURATION (for Vercel Functions)
// =================================================================================
// This file configures Firebase for the backend serverless function.
// It MUST use environment variables WITHOUT the `VITE_` prefix (e.g., `FIREBASE_PROJECT_ID`).
// These are standard server-side variables set in your Vercel project settings.
//
// IMPORTANT: These variables MUST point to the SAME Firebase project as the
// client-side configuration in `firebaseConfig.ts` to ensure that authentication,
// user history, and feedback all work together seamlessly.
// =================================================================================

let firebaseApp: FirebaseApp;
let isConfigured = false;

try {
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key is often stored with escaped newlines. We need to replace them
        // back to actual newlines for the SDK to parse it correctly.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // Check if the essential parts of the service account are configured.
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        const appName = 'Sawtli-Feedback-API-Admin';
        const existingApp = getApps().find(app => app.name === appName);
        if (existingApp) {
            firebaseApp = existingApp;
        } else {
            firebaseApp = initializeApp({ credential: cert(serviceAccount) }, appName);
        }
        isConfigured = true;
    }
} catch (e) {
    console.error("Failed to initialize Firebase Admin SDK:", e);
    isConfigured = false;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // If the server-side environment variables are missing, inform the client.
    if (!isConfigured) {
        return res.status(200).json({ 
            configured: false, 
            error: 'Firebase Admin SDK is not configured for the API. Please set the required FIREBASE_* environment variables for the service account in Vercel.' 
        });
    }

    const db = getFirestore(firebaseApp);

    if (req.method === 'GET') {
        try {
            // FIX: Use Firebase Admin SDK's chained method calls instead of client-side functional API.
            const feedbackCollectionRef = db.collection('feedback');
            const q = feedbackCollectionRef.orderBy('createdAt', 'desc');
            const querySnapshot = await q.get();

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

            // FIX: Use Firebase Admin SDK's chained method calls instead of client-side functional API.
            const feedbackCollectionRef = db.collection('feedback');
            await feedbackCollectionRef.add({
                name: name || 'Anonymous',
                comment,
                rating,
                createdAt: Timestamp.now(),
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