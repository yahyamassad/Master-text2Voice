
import { initializeApp, getApps, App as FirebaseApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Firebase Admin Init ---
let firebaseApp: FirebaseApp;
let isConfigured = false;

try {
    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        const appName = 'Sawtli-Verify-Admin';
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
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { code, userId } = req.body;
        
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ valid: false });
        }

        const input = code.trim();
        const inputUpper = input.toUpperCase();
        const lowerInput = input.toLowerCase();

        // 1. Check Hardcoded Admin Codes (Legacy/Emergency)
        const serverSecret = process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE;
        const devCodes = ['sawtli-master', 'friend', 'صديق', 'dinner'];
        
        if (devCodes.includes(lowerInput)) {
            return res.status(200).json({ valid: true, type: 'admin', duration: 365 });
        } else if (serverSecret) {
            const cleanSecret = serverSecret.trim();
            if (input === cleanSecret || lowerInput === cleanSecret.toLowerCase()) {
                return res.status(200).json({ valid: true, type: 'admin', duration: 365 });
            }
        }

        // 2. Check Firestore for Single-Use Coupons
        if (isConfigured && input.includes('-')) {
            const db = getFirestore(firebaseApp);
            // Search by Document ID (Code is the ID)
            // Note: Codes are stored uppercase in generation usually, but let's be case-insensitive by trying standard format
            // Our generator creates UPPERCASE codes e.g. GOLD-XXXX-YYYY
            
            const docRef = db.collection('coupons').doc(inputUpper);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                
                if (data?.isUsed) {
                    return res.status(200).json({ valid: false, error: 'Coupon already used' });
                }

                // VALID COUPON!
                // Mark as used immediately
                if (userId) {
                    await docRef.update({
                        isUsed: true,
                        usedBy: userId,
                        usedAt: Timestamp.now()
                    });
                }

                return res.status(200).json({ 
                    valid: true, 
                    type: data?.plan || 'onedollar', 
                    duration: data?.durationDays || 3 
                });
            }
        }

        return res.status(200).json({ valid: false });

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(200).json({ valid: false, error: 'Internal validation error' });
    }
}
