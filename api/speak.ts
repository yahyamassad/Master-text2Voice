
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

    // THE ONLY MODEL WE USE (High Quality TTS)
    const MODEL_NAME = 'gemini-2.5-flash-preview-tts';

    // Retry configuration for 429/Busy errors
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt} for TTS...`);
                await delay(BASE_DELAY * Math.pow(2, attempt - 1)); // Exponential backoff: 1s, 2s, 4s
            }

            const response = await client.models.generateContent({
                model: MODEL_NAME,
                contents: {
                    role: 'user',
                    parts: [{ text: text }]
                },
                config: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: speakers?.speakerA?.voice || voice || 'Puck'
                            }
                        }
                    }
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (audioData) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_NAME });
            } else {
                throw new Error("API returned no audio data.");
            }

        } catch (error: any) {
            lastError = error;
            const errMsg = error.message || error.toString();
            
            // Check if we should retry
            // Retry on: 429 (Too Many Requests), 503 (Service Unavailable), or "busy" messages
            const isRetryable = 
                errMsg.includes('429') || 
                errMsg.includes('503') || 
                errMsg.includes('busy') || 
                errMsg.includes('quota') || // Sometimes quota errors are temporary spikes
                errMsg.includes('RESOURCE_EXHAUSTED');

            // If it's NOT a retryable error (like 400 Bad Request, or 403 Key Invalid), break immediately
            if (!isRetryable) {
                break;
            }
            
            // If we reached max retries, loop will finish and throw the last error below
        }
    }

    // If we get here, all attempts failed
    console.error("Speak API Final Error:", lastError);
    
    let statusCode = 500;
    let errorMessage = "Failed to generate speech.";
    const errString = lastError?.message || lastError?.toString() || '';

    if (errString.includes('429') || errString.includes('quota') || errString.includes('RESOURCE_EXHAUSTED')) {
        statusCode = 429;
        errorMessage = "Server capacity reached or busy. Please try again later.";
    } else if (errString.includes('403')) {
        statusCode = 403;
        errorMessage = "Access Denied. Please remove 'Website Restrictions' from your API Key in Google Cloud Console.";
    } else if (errString.includes('400')) {
        statusCode = 400;
        errorMessage = "Invalid Request. The model might not support the requested configuration.";
    }

    return res.status(statusCode).json({ error: errorMessage, details: errString });
}
