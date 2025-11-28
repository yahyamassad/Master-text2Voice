
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

    // USE GEMINI 2.0 FLASH EXPERIMENTAL
    // This model supports native audio generation via responseModalities: ['AUDIO']
    // It has separate quotas from the dedicated TTS models.
    const MODEL_NAME = 'gemini-2.0-flash-exp';

    // Map legacy voice names to Prompt Instructions since 2.0 doesn't support 'speechConfig'
    const getVoiceInstruction = (voiceName: string) => {
        switch (voiceName) {
            case 'Puck': return 'Use a clear, confident Male voice with a British undertone.';
            case 'Charon': return 'Use a deep, authoritative Male voice.';
            case 'Fenrir': return 'Use an energetic, fast-paced Male voice.';
            case 'Kore': return 'Use a calm, soothing Female voice.';
            case 'Zephyr': return 'Use a bright, cheerful Female voice.';
            default: return 'Use a clear, professional narration voice.';
        }
    };

    const selectedVoice = speakers?.speakerA?.voice || voice || 'Puck';
    const voicePrompt = getVoiceInstruction(selectedVoice);
    
    // Construct the prompt to ensure audio output
    // We wrap the user text to ensure the model reads it and doesn't just chat about it.
    const finalPrompt = `
    Task: Read the following text aloud.
    Style: ${voicePrompt}
    
    Text to read:
    "${text}"
    `;

    // Retry configuration
    const MAX_RETRIES = 2;
    const BASE_DELAY = 1500;

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                await delay(BASE_DELAY * attempt);
            }

            const response = await client.models.generateContent({
                model: MODEL_NAME,
                contents: {
                    role: 'user',
                    parts: [{ text: finalPrompt }]
                },
                config: {
                    responseModalities: ['AUDIO'], // Critical for 2.0-flash-exp
                    // NOTE: speechConfig is REMOVED as it causes 400 errors on this model
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (audioData) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_NAME });
            } else {
                // If model returns text instead of audio (fallback behavior)
                const textData = response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textData) {
                    console.warn("Model returned text instead of audio:", textData);
                    throw new Error("Model returned text instead of audio. Please try again.");
                }
                throw new Error("API returned no audio data.");
            }

        } catch (error: any) {
            lastError = error;
            const errMsg = error.message || error.toString();
            console.log(`Attempt ${attempt + 1} failed: ${errMsg}`);
            
            const isRetryable = 
                errMsg.includes('429') || 
                errMsg.includes('503') || 
                errMsg.includes('busy') || 
                errMsg.includes('quota') ||
                errMsg.includes('RESOURCE_EXHAUSTED');

            if (!isRetryable) break;
        }
    }

    console.error("Speak API Final Error:", lastError);
    
    let statusCode = 500;
    let errorMessage = "Failed to generate speech.";
    const errString = lastError?.message || lastError?.toString() || '';

    if (errString.includes('429') || errString.includes('quota')) {
        statusCode = 429;
        errorMessage = "Server busy. Please try again in a moment.";
    } else if (errString.includes('400')) {
        statusCode = 400;
        errorMessage = "Invalid Request. The 2.0 model might be temporarily unstable.";
    }

    return res.status(statusCode).json({ error: errorMessage, details: errString });
}
