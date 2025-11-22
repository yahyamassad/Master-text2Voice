import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A debug endpoint for the speak functionality.
 * This is a placeholder and is not currently implemented.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Allow', ['POST']);
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    res.status(501).json({ 
        message: 'Not Implemented',
        note: 'This debug endpoint is reserved for future use.'
    });
}
