
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // STRATEGY:
    // 1. Try the Specialized TTS Model (Best Quality, restricted quota 15/day for free tier)
    // 2. If Quota Exceeded (429), Fallback to Multimodal Model (Good Quality, separate quota)
    
    const MODEL_HQ = 'gemini-2.5-flash-preview-tts';
    const MODEL_FALLBACK = 'gemini-2.0-flash-exp';

    // Prepare Config for HQ Model
    const selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';
    const speechConfig = {
        voiceConfig: {
            prebuiltVoiceConfig: {
                voiceName: selectedVoiceName,
            },
        },
    };

    // Retry configuration
    const MAX_RETRIES = 1; // Keep low to failover quickly
    
    // --- ATTEMPT 1: HIGH QUALITY TTS ---
    try {
        const response = await client.models.generateContent({
            model: MODEL_HQ,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: speechConfig,
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_HQ });
        }
    } catch (error: any) {
        const errMsg = error.message || error.toString();
        console.warn(`HQ Model failed (${errMsg}). Attempting fallback...`);
        
        // Only fallback on specific errors that indicate the model is unavailable or quota exceeded
        if (!errMsg.includes('429') && !errMsg.includes('quota') && !errMsg.includes('busy') && !errMsg.includes('503')) {
             // If it's a logic error (like invalid key), fail immediately
             return res.status(500).json({ error: "Generation failed.", details: errMsg });
        }
    }

    // --- ATTEMPT 2: FALLBACK MULTIMODAL (Gemini 2.0) ---
    // Critical: 2.0 Does NOT support speechConfig. We must use Prompt Engineering instead.
    try {
        await delay(1000); // Brief pause before fallback

        // Map voice name to a text description for the model
        const getVoicePrompt = (vName: string) => {
            switch (vName) {
                case 'Puck': return 'British Male';
                case 'Charon': return 'Deep Male';
                case 'Fenrir': return 'Fast Male';
                case 'Kore': return 'Calm Female';
                case 'Zephyr': return 'Cheerful Female';
                default: return 'Professional';
            }
        };
        
        const voiceStyle = getVoicePrompt(selectedVoiceName);
        const prompt = `Read the following text aloud with a ${voiceStyle} voice: "${text}"`;

        const response = await client.models.generateContent({
            model: MODEL_FALLBACK,
            contents: {
                role: 'user',
                parts: [{ text: prompt }]
            },
            config: {
                responseModalities: ['AUDIO'],
                // speechConfig REMOVED for 2.0 compatibility
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (audioData) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_FALLBACK });
        } else {
             // Sometimes 2.0 returns text if it refuses to generate audio
             throw new Error("Fallback model returned no audio.");
        }

    } catch (fallbackError: any) {
        console.error("Fallback failed:", fallbackError);
        
        const errString = fallbackError.message || fallbackError.toString();
        let statusCode = 500;
        let clientMsg = "Server busy. Please try again later.";

        if (errString.includes('429') || errString.includes('quota')) {
            statusCode = 429;
            clientMsg = "Server capacity reached. Please try again later.";
        }

        return res.status(statusCode).json({ error: clientMsg, details: errString });
    }
}
