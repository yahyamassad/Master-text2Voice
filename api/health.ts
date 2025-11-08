import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * A simple health check endpoint.
 * Responds with a 200 OK status to indicate that the serverless functions are running.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}