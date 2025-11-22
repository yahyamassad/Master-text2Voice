
// FIX: The Firebase Admin SDK exports the app type as 'App', not 'FirebaseApp'. Using an alias for compatibility.
import { initializeApp, getApps, App as FirebaseApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Reuse existing Firebase config logic from api/feedback.ts or similar
// For production, this should be centralized, but repeating for isolation in this example.

let firebaseApp: FirebaseApp;
let isConfigured = false;

try {
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        const appName = 'Sawtli-Report-API-Admin';
        const existingApp = getApps().find(app => app.name === appName);
        if (existingApp) {
            firebaseApp = existingApp;
        } else {
            firebaseApp = initializeApp({ credential: cert(serviceAccount) }, appName);
        }
        isConfigured = true;
    }
} catch (e) {
    console.error("Failed to initialize Firebase Admin SDK for Reports:", e);
    isConfigured = false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!isConfigured) {
        // In a real scenario, we might log this but return success to UI to not frustrate user,
        // or return a specific error code. Here we return error.
        return res.status(503).json({ error: 'Report service is not configured server-side.' });
    }

    try {
        const { issueType, description, screenshot, userUid, userAgent, url } = req.body;
        
        if (!issueType || !description) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const db = getFirestore(firebaseApp);
        const reportsRef = db.collection('reports');

        await reportsRef.add({
            issueType,
            description,
            screenshot: screenshot || null, // Base64 string
            userUid,
            userAgent,
            url,
            createdAt: Timestamp.now(),
            status: 'new'
        });

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Error submitting report:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
