
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
        const serverSecret = process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE;

        // 2. Define Hardcoded Friendly Codes
        // 'dev' grants admin access
        const devCodes = ['sawtli-master', 'friend', 'صديق', 'dinner'];
        
        // 'student' grants OneDollar tier access (Educational License)
        const studentCodes = ['student', 'edu2025', 'class', 'طالب', 'مدرسة', 'sawtli-edu'];

        // Response Object
        let result = { valid: false, type: 'invalid' };

        // Check Admin/Dev Codes
        if (devCodes.includes(lowerInput)) {
            result = { valid: true, type: 'admin' };
        } else if (serverSecret) {
            const cleanSecret = serverSecret.trim();
            if (input === cleanSecret || lowerInput === cleanSecret.toLowerCase()) {
                result = { valid: true, type: 'admin' };
            }
        }

        // Check Student Codes (If not already admin)
        if (!result.valid && studentCodes.includes(lowerInput)) {
            result = { valid: true, type: 'onedollar' };
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(200).json({ valid: false, error: 'Internal validation error' });
    }
}
