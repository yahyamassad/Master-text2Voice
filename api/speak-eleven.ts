
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voiceId, stability, clarity } = req.body;
    const apiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!apiKey) {
        return res.status(503).json({ error: 'ElevenLabs is not configured on this server.' });
    }

    if (!text || !voiceId) {
        return res.status(400).json({ error: 'Text and Voice ID are required.' });
    }

    try {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: stability || 0.5,
                    similarity_boost: clarity || 0.75
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail?.message || 'ElevenLabs API Error');
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        return res.status(200).json({ audioContent: base64Audio, engine: 'elevenlabs' });

    } catch (error: any) {
        console.error("ElevenLabs Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
