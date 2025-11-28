
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

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server Error: API Key missing.' });
    }

    const client = new GoogleGenAI({ apiKey });

    // STRATEGY: Use the specialized TTS models.
    // Primary: 'gemini-2.5-flash-tts' (Production version, likely better quotas)
    // Fallback: 'gemini-2.5-flash-preview-tts' (Preview version, stricter quotas)
    const MODELS_TO_TRY = ['gemini-2.5-flash-tts', 'gemini-2.5-flash-preview-tts'];
    
    const selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';

    // Helper for delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let lastError: any = null;

    // Try models in sequence
    for (const modelName of MODELS_TO_TRY) {
        try {
            console.log(`Attempting TTS with model: ${modelName}`);
            
            // Retry logic for 429/Busy errors on the CURRENT model
            const MAX_RETRIES = 3;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const response = await client.models.generateContent({
                        model: modelName,
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
                        return res.status(200).json({ audioContent: audioData, modelUsed: modelName });
                    }
                    
                    // If no audio but no error, break retry loop to try next model
                    break; 

                } catch (err: any) {
                    const errMsg = err.message || err.toString();
                    console.warn(`Attempt ${attempt} failed for ${modelName}: ${errMsg}`);

                    // If it's a 400/404 (Model not found/Invalid), don't retry this model, go to next model
                    if (errMsg.includes('400') || errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('valid')) {
                        throw err; // Break out of retry loop, catch in outer loop
                    }

                    // If it's a 429/503 (Busy/Quota), retry with backoff
                    if (errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('busy') || errMsg.includes('quota') || errMsg.includes('overloaded')) {
                        if (attempt === MAX_RETRIES) throw err; // Exhausted retries for this model
                        await delay(1500 * attempt); // 1.5s, 3s, 4.5s
                        continue;
                    }

                    throw err; // Other errors, try next model
                }
            }

        } catch (error: any) {
            console.error(`Failed with model ${modelName}:`, error.message);
            lastError = error;
            // Continue to next model in the list
        }
    }

    // If we reach here, all models failed
    const finalErrorMessage = lastError?.message || "Unknown error";
    
    // Check for API Key restriction error specifically (403)
    if (finalErrorMessage.includes('403') || finalErrorMessage.includes('permission')) {
        return res.status(403).json({ 
            error: "API Key Permission Error. Please remove 'Website Restrictions' from your API Key in Google Cloud Console.",
            details: finalErrorMessage
        });
    }

    // Check for Quota error (429)
    if (finalErrorMessage.includes('429') || finalErrorMessage.includes('quota')) {
        return res.status(429).json({ 
            error: "Server capacity reached (Quota Exceeded). Please try again later.",
            details: finalErrorMessage
        });
    }

    return res.status(500).json({ 
        error: "Generation failed. Server busy or model unavailable.", 
        details: finalErrorMessage 
    });
}
