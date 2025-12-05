
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
        // Check for both ADMIN_ACCESS_CODE (preferred) and legacy VITE_ADMIN_ACCESS_CODE
        const serverSecret = process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE;

        // 2. Define Hardcoded Friendly Codes
        const friendlyCodes = ['sawtli-master', 'friend', 'صديق', 'dinner'];

        let isValid = false;

        // Check Hardcoded
        if (friendlyCodes.includes(lowerInput)) {
            isValid = true;
        }

        // Check Environment Variable (Robust Comparison)
        if (serverSecret) {
            const cleanSecret = serverSecret.trim();
            // Allow case-insensitive match for the environment secret as well for ease of use
            if (input === cleanSecret || lowerInput === cleanSecret.toLowerCase()) {
                isValid = true;
            }
        }

        // Return result
        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false });
        }

    } catch (error) {
        console.error("Verification Error:", error);
        // Even if there's an error, we return 200 with valid: false to avoid client-side crash/error alerts
        // unless it's a critical system failure.
        return res.status(200).json({ valid: false, error: 'Internal validation error' });
    }
}
