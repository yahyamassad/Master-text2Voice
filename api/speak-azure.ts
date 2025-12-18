
import { Buffer } from 'buffer';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Microsoft Azure Text-to-Speech API Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, ssml, voiceId } = body;

    const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
    const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

    if (!AZURE_KEY || !AZURE_REGION) {
        return res.status(503).json({ error: 'Azure Speech Service is not configured.' });
    }

    const selectedVoice = voiceId || "ar-EG-SalmaNeural";
    const voiceParts = selectedVoice.split('-');
    const langCode = voiceParts.length >= 2 ? `${voiceParts[0]}-${voiceParts[1]}` : 'en-US';
    
    const finalSSML = ssml || `
        <speak version='1.0' xml:lang='${langCode}'>
            <voice xml:lang='${langCode}' xml:gender='Female' name='${selectedVoice}'>
                ${text}
            </voice>
        </speak>
    `;

    try {
        const url = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY,
                'Content-Type': 'application/ssml+xml',
                // تم رفع الجودة إلى 48khz و 320kbitrate لضمان أداء احترافي جداً
                'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
                'User-Agent': 'SawtliApp'
            },
            body: finalSSML
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure API Error (${response.status}): ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString('base64');

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ 
            audioContent: base64Audio,
            format: 'mp3',
            engine: 'azure-neural'
        });

    } catch (error: any) {
        console.error("Azure TTS Error:", error);
        return res.status(500).json({ error: "Failed to generate speech via Azure." });
    }
}
