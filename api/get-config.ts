import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const config = {
            apiKey: process.env.API_KEY,
            firebaseConfig: {
                apiKey: process.env.VITE_FIREBASE_API_KEY,
                authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.VITE_FIREBASE_APP_ID,
            },
        };

        const isApiKeyConfigured = config.apiKey && config.apiKey.trim() !== '';
        const isFirebaseConfigured = Object.values(config.firebaseConfig).every(value => value && value.trim() !== '');

        if (!isApiKeyConfigured) {
             return res.status(500).json({ error: 'Server configuration error: Gemini API_KEY is missing.' });
        }

        res.status(200).json({
            apiKey: config.apiKey,
            firebaseConfig: isFirebaseConfigured ? config.firebaseConfig : null
        });

    } catch (error) {
        console.error('Error fetching server config:', error);
        res.status(500).json({ error: 'An internal error occurred while fetching configuration.' });
    }
}
