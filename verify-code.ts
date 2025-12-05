
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { code } = req.body;
        
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ valid: false });
        }

        const input = code.trim();
        const lowerInput = input.toLowerCase();

        // 1. Get the Secret from Server Environment (Secure)
        // Note: In Vercel, change your var from 'VITE_ADMIN_ACCESS_CODE' to 'ADMIN_ACCESS_CODE'
        const serverSecret = process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE;

        // 2. Define Hardcoded Friendly Codes (Optional, harmless to keep here)
        const friendlyCodes = ['sawtli-master', 'friend', 'صديق', 'dinner'];

        let isValid = false;

        // Check Hardcoded
        if (friendlyCodes.includes(lowerInput)) {
            isValid = true;
        }

        // Check Environment Variable (Exact Match)
        if (serverSecret && (input === serverSecret || lowerInput === serverSecret.toLowerCase())) {
            isValid = true;
        }

        // Return result without revealing the actual keys
        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(500).json({ error: 'Verification failed' });
    }
}
