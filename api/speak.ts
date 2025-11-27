
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

    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- STRATEGY: HYBRID ROBUSTNESS ---
    // 1. Primary: The specialized TTS model (Highest Quality, but strict quotas)
    // 2. Fallback: The experimental Flash model (Good Quality, generous quotas, handles audio generation)
    
    const PRIMARY_MODEL = 'gemini-2.5-flash-preview-tts';
    const FALLBACK_MODEL = 'gemini-2.0-flash-exp';

    try {
        // --- ATTEMPT 1: Primary High-Quality TTS ---
        // console.log(`Attempting Primary Model: ${PRIMARY_MODEL}`);
        
        const configPrimary: any = {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: speakers?.speakerA?.voice || voice || 'Puck'
                    }
                }
            }
        };

        const responsePrimary = await client.models.generateContent({
            model: PRIMARY_MODEL,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: configPrimary,
        });

        const audioPrimary = responsePrimary.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (audioPrimary) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ audioContent: audioPrimary, modelUsed: 'primary' });
        }
        
        // If we reach here without audio and without error, throw to trigger fallback
        throw new Error("Primary model returned no audio.");

    } catch (primaryError: any) {
        // console.warn(`Primary model failed (${primaryError.message}). Switching to Fallback...`);

        // Check if error is fatal (Auth/Key issue) - in that case, don't fallback, just fail
        if (primaryError.message?.includes('API key') || primaryError.message?.includes('403')) {
             return res.status(403).json({ error: "Access Denied: Please check API Key restrictions." });
        }

        // --- ATTEMPT 2: Fallback (The Safety Net) ---
        try {
            // For the fallback model, we MUST NOT use `speechConfig` as it causes 400 Invalid Argument.
            // Instead, we use prompt engineering to request speech.
            
            const targetVoice = speakers?.speakerA?.voice || voice || 'Puck';
            // Simple mapping for prompt engineering
            const gender = ['Puck', 'Charon', 'Fenrir'].includes(targetVoice) ? 'male' : 'female';
            
            const systemPrompt = `Read the following text clearly and naturally with a ${gender} voice. Do not add any introductory text. Just the audio.`;

            const responseFallback = await client.models.generateContent({
                model: FALLBACK_MODEL,
                contents: {
                    role: 'user',
                    parts: [{ text: text }]
                },
                config: {
                    responseModalities: ['AUDIO'], // Request Audio Output
                    systemInstruction: systemPrompt,
                    // vital: remove speechConfig here
                },
            });

            const audioFallback = responseFallback.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (audioFallback) {
                res.setHeader('Content-Type', 'application/json');
                // Return success, user doesn't need to know we switched engines
                return res.status(200).json({ audioContent: audioFallback, modelUsed: 'fallback' });
            } else {
                throw new Error("Fallback model returned no audio.");
            }

        } catch (fallbackError: any) {
            console.error("All models failed.", fallbackError);
            
            // Analyze the root cause for the final error message
            let userMessage = "Service temporarily unavailable. Please try again in a moment.";
            let statusCode = 500;

            if (fallbackError.message?.includes('429') || fallbackError.message?.includes('quota')) {
                statusCode = 429;
                userMessage = "High traffic volume. Please wait 30 seconds before retrying.";
            }

            return res.status(statusCode).json({ 
                error: userMessage, 
                details: `Primary: ${primaryError.message} | Fallback: ${fallbackError.message}` 
            });
        }
    }
}
