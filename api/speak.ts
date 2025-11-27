
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500; // Wait 1.5s, then 3s, then 4.5s

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Default fallback voice
    const safeVoice = voice || 'Puck';

    // We strictly use the specialized TTS model. 
    // The user has enabled the quota for this model in Google Console.
    const model = "gemini-2.5-flash-preview-tts";

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let speechConfig: any = {};

        if (speakers) {
            speechConfig.multiSpeakerVoiceConfig = {
                speakerVoiceConfigs: [
                    {
                        speaker: speakers.speakerA.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } }
                    },
                    {
                        speaker: speakers.speakerB.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } }
                    }
                ]
            };
        } else {
            speechConfig.voiceConfig = { 
                prebuiltVoiceConfig: { 
                    voiceName: safeVoice 
                } 
            };
        }

        // --- RETRY LOGIC (Exponential Backoff) ---
        // This handles "Server Busy" (429) errors by waiting and retrying
        // instead of failing immediately.
        let lastError: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Increased timeout for audio generation
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TTS Request timed out')), 45000));

                const apiPromise = ai.models.generateContent({
                    model,
                    contents: {
                        role: 'user',
                        parts: [{ text: text }]
                    },
                    config: {
                        responseModalities: ['AUDIO'], 
                        speechConfig: speechConfig,
                    },
                });

                const result: any = await Promise.race([apiPromise, timeoutPromise]);
                
                const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                
                if (!base64Audio) {
                    const reason = result.candidates?.[0]?.finishReason || 'Unknown';
                    // Treat quota issues as retryable errors
                    if (reason === 'QUOTA_EXCEEDED' || reason === 'RESOURCE_EXHAUSTED') {
                        throw new Error('429 RESOURCE_EXHAUSTED');
                    }
                    throw new Error(`Model finished without audio. Reason: ${reason}`);
                }

                // Success! Return immediately
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ audioContent: base64Audio });

            } catch (err: any) {
                lastError = err;
                
                // Identify if the error is a temporary capacity/quota issue
                const isRetryable = 
                    err.message?.includes('429') || 
                    err.message?.includes('RESOURCE_EXHAUSTED') || 
                    err.message?.includes('quota') ||
                    err.message?.includes('busy') ||
                    err.message?.includes('overloaded') ||
                    err.status === 429 ||
                    err.status === 503;

                if (isRetryable && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * attempt;
                    console.warn(`Attempt ${attempt} failed (Busy/Quota). Retrying in ${delay}ms...`);
                    await sleep(delay);
                    continue; // Try again
                }
                
                // If error is not retryable (e.g. 400 Invalid Argument), break immediately
                if (!isRetryable) break;
            }
        }

        // If we exit the loop, all retries failed
        throw lastError;
        
    } catch (error: any) {
        console.error("Speech Generation Error (Final):", error);
        
        let errorMessage = "Speech generation failed.";
        let statusCode = 500;

        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            errorMessage = "Server is currently busy. Please try again in a few seconds.";
            statusCode = 429;
        } else if (error.message && error.message.includes('400')) {
            errorMessage = "Invalid request configuration.";
            statusCode = 400;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
}
