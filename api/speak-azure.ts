
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

    // Validate Keys
    const AZURE_KEY = process.env.AZURE_SPEECH_KEY;
    const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

    if (!AZURE_KEY || !AZURE_REGION) {
        return res.status(503).json({ error: 'Azure Speech Service is not configured (Server Side). Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION.' });
    }

    if (!text && !ssml) {
        return res.status(400).json({ error: 'Text or SSML is required.' });
    }

    // Default Voice
    const selectedVoice = voiceId || "ar-EG-SalmaNeural";
    
    // Construct SSML if not provided
    // Azure requires a wrapping <speak> tag with xml:lang
    // We assume the lang from the voice ID (e.g., ar-EG-SalmaNeural -> ar-EG)
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
                'X-Microsoft-OutputFormat': 'audio-24khz-160kbitrate-mono-mp3',
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
            engine: 'azure-neural',
            voiceUsed: selectedVoice
        });

    } catch (error: any) {
        console.error("Azure TTS Error:", error);
        return res.status(500).json({ 
            error: "Failed to generate speech via Azure.",
            details: error.message || error.toString()
        });
    }
}
