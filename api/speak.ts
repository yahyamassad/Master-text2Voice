
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
            console.error("Failed to parse body:", e);
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, voice, speakers } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    // Use SAWTLI_GEMINI_KEY as verified in Vercel settings
    const apiKey = process.env.SAWTLI_GEMINI_KEY || process.env.API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Server Error: API Key is missing.' });
    }

    const client = new GoogleGenAI({ apiKey });

    // CONFIRMED MODEL: gemini-2.5-flash-tts
    // Status: Paid Tier 1
    // Quota: 10 RPM (Requests Per Minute) / 100 RPD (Requests Per Day)
    const MODEL_NAME = 'gemini-2.5-flash-tts';
    
    const selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';

    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Robust Retry Logic for 10 RPM Limit
        // We try 5 times with increasing delays to handle the "speed limit"
        const MAX_RETRIES = 5;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await client.models.generateContent({
                    model: MODEL_NAME,
                    contents: {
                        role: 'user',
                        parts: [{ text: text }]
                    },
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoiceName } }
                        }
                    },
                });

                const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (audioData) {
                    res.setHeader('Content-Type', 'application/json');
                    return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_NAME });
                }
                
                throw new Error("API returned no audio data.");

            } catch (err: any) {
                const errMsg = err.message || err.toString();
                const isRateLimit = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('busy') || errMsg.includes('quota');

                if (isRateLimit) {
                    console.warn(`Attempt ${attempt} hit rate limit (10 RPM). Retrying in ${attempt * 2}s...`);
                    if (attempt === MAX_RETRIES) throw err;
                    
                    // Exponential backoff: 2s, 4s, 6s, 8s...
                    // Essential for the strict 10 requests/minute limit
                    await delay(2000 * attempt); 
                    continue;
                }

                // If it's not a rate limit error (e.g. 400 Invalid Argument), fail immediately
                throw err;
            }
        }

    } catch (error: any) {
        console.error(`Final Failure with ${MODEL_NAME}:`, error.message);
        
        // Detailed error for client handling
        if (error.message.includes('429') || error.message.includes('quota')) {
            return res.status(429).json({ 
                error: "Server capacity reached (10 requests/min limit). Please wait a moment and try again.",
                details: error.message
            });
        }

        return res.status(500).json({ 
            error: "Generation failed.", 
            details: error.message 
        });
    }
    
    return res.status(500).json({ error: "Unexpected end of function" });
}
