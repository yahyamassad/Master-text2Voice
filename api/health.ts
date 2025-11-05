import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
    runtime: 'nodejs',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const isConfigured = !!process.env.API_KEY;

    if (isConfigured) {
        return res.status(200).json({ configured: true });
    } else {
        return res.status(200).json({
            configured: false,
            message: 'SERVER_CONFIG_ERROR: The API_KEY environment variable is not set. Translation and speech features are disabled. The app owner must configure the API_KEY environment variable in their deployment settings to enable the core functionality of the application.'
        });
    }
}
