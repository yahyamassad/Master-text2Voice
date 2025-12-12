
import { initializeApp, getApps, App as FirebaseApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Reusing Firebase Admin Initialization Logic ---
let firebaseApp: FirebaseApp;
let isConfigured = false;

try {
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        const appName = 'Sawtli-Coupon-Gen-Admin';
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

function generateRandomCode(prefix: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0 to avoid confusion
    let result = '';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    let result2 = '';
    for (let i = 0; i < 4; i++) result2 += chars.charAt(Math.floor(Math.random() * chars.length));
    
    return `${prefix}-${result}-${result2}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!isConfigured) {
        return res.status(500).json({ error: 'Server DB Not Configured' });
    }

    // Security Check: Ensure the requester has the Admin Secret
    const { adminSecret, type } = req.body;
    const serverSecret = process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE;

    if (!serverSecret || adminSecret !== serverSecret) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = getFirestore(firebaseApp);
    const couponsRef = db.collection('coupons');

    let plan = 'onedollar';
    let durationDays = 3;
    let prefix = 'TRIAL';

    if (type === 'gold') {
        plan = 'gold';
        durationDays = 7;
        prefix = 'GOLD';
    }

    const code = generateRandomCode(prefix);

    try {
        await couponsRef.doc(code).set({
            code,
            plan,
            durationDays,
            isUsed: false,
            createdAt: Timestamp.now(),
            createdBy: 'admin'
        });

        return res.status(200).json({ code, plan, durationDays });
    } catch (error: any) {
        console.error("Coupon Generation Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
