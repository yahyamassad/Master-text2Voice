
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds delay

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

    // STRICTLY USE THE SPECIALIZED TTS MODEL
    // This is the model that supports 'speechConfig' and high-quality voice cloning.
    const model = 'gemini-2.5-flash-preview-tts';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare config based on single or multi-speaker
        let config: any = {
            responseModalities: ['AUDIO'],
        };

        if (speakers) {
            // Multi-speaker config
            config.speechConfig = {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: speakers.speakerA?.voice || 'Puck' // Primary fallback
                    }
                }
            };
            // Note: True multi-speaker config requires specific formatting in the prompt 
            // or specific API structures that are currently in preview. 
            // For now, we rely on the model interpreting speaker labels in the text 
            // combined with the primary voice config.
        } else {
            // Single speaker config
            config.speechConfig = {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: voice || 'Puck'
                    }
                }
            };
        }

        // --- RETRY LOGIC FOR 429/BUSY ERRORS ---
        let lastError: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Timeout safety
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TTS Request timed out')), 45000));

                const apiPromise = ai.models.generateContent({
                    model,
                    contents: {
                        role: 'user',
                        parts: [{ text: text }]
                    },
                    config: config,
                });

                const result: any = await Promise.race([apiPromise, timeoutPromise]);
                
                const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                
                if (!base64Audio) {
                    const reason = result.candidates?.[0]?.finishReason || 'Unknown';
                    // If finishReason suggests quota issues, treat as error to trigger retry
                    if (reason === 'QUOTA_EXCEEDED' || reason === 'RESOURCE_EXHAUSTED') {
                        throw new Error('429 RESOURCE_EXHAUSTED');
                    }
                    throw new Error(`Model finished without audio. Reason: ${reason}`);
                }

                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ audioContent: base64Audio });

            } catch (err: any) {
                lastError = err;
                
                // Identify retryable errors (Busy, Quota, Server Error)
                const isRetryable = 
                    err.message?.includes('429') || 
                    err.message?.includes('RESOURCE_EXHAUSTED') || 
                    err.message?.includes('quota') ||
                    err.message?.includes('busy') ||
                    err.message?.includes('Overloaded') ||
                    err.status === 429 ||
                    err.status === 503;

                // If error is 400 (Invalid Argument), DO NOT RETRY. It means config is wrong.
                if (err.message?.includes('400') || err.status === 400 || err.message?.includes('INVALID_ARGUMENT')) {
                    console.error("Configuration Error (Not Retryable):", err.message);
                    break; 
                }

                if (isRetryable && attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * attempt; // 2s, 4s, 6s...
                    console.warn(`Attempt ${attempt} failed (Busy/Quota). Retrying in ${delay}ms...`);
                    await sleep(delay);
                    continue;
                }
                
                // If not retryable or max retries reached, break loop
                break;
            }
        }

        // If loop finishes without success
        throw lastError;
        
    } catch (error: any) {
        console.error("Speech Generation Error:", error);
        
        let errorMessage = "Speech generation failed.";
        let statusCode = 500;

        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            errorMessage = "Server capacity reached or busy. Please try again later.";
            statusCode = 429;
        } else if (error.message && error.message.includes('400')) {
            errorMessage = "Invalid voice configuration.";
            statusCode = 400;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
}
