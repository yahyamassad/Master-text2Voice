
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

    // REVERTED TO WORKING ENDPOINT: gemini-2.5-flash-preview-tts
    const MODEL_NAME = 'gemini-2.5-flash-preview-tts';
    
    const selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';

    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Retry Logic
        const MAX_RETRIES = 3;
        
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
                        // REMOVED: systemInstruction, temperature, topP, topK 
                        // These parameters are not supported by the TTS model and cause 500 errors.
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
                // 429: Too Many Requests, 503: Service Unavailable
                const isRateLimit = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('busy') || errMsg.includes('quota');

                if (isRateLimit) {
                    console.warn(`Attempt ${attempt} hit rate limit. Retrying in ${attempt * 1000}ms...`);
                    if (attempt === MAX_RETRIES) throw err;
                    await delay(1000 * attempt); 
                    continue;
                }

                // If it's a 404 (Model Not Found) or 400 (Invalid Argument), fail immediately
                throw err;
            }
        }

    } catch (error: any) {
        console.error(`Final Failure with ${MODEL_NAME}:`, error.message);
        
        // Return the EXACT error from Google to help debugging
        const errorMessage = error.message || "Unknown error";

        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            return res.status(429).json({ 
                error: "Server capacity reached. Please wait a moment and try again.",
                details: errorMessage
            });
        }

        return res.status(500).json({ 
            error: "Generation failed.", 
            details: errorMessage // Show the real reason (e.g., Model not found)
        });
    }
    
    return res.status(500).json({ error: "Unexpected end of function" });
}
