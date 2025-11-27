
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

    // The ONLY model that currently supports high-quality TTS via API
    const MODEL_NAME = 'gemini-2.5-flash-preview-tts';

    const makeRequest = async (attempt: number = 1): Promise<any> => {
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
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: speakers?.speakerA?.voice || voice || 'Puck'
                            }
                        }
                    }
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!audioData) {
                throw new Error("API returned no audio data.");
            }
            return audioData;

        } catch (error: any) {
            const isRetryable = 
                error.message?.includes('429') || 
                error.message?.includes('503') || 
                error.message?.includes('quota') ||
                error.message?.includes('busy');

            if (isRetryable && attempt <= 3) {
                // Exponential Backoff: Wait 1s, then 2s, then 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`Attempt ${attempt} failed (${error.message}). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return makeRequest(attempt + 1);
            }
            
            throw error;
        }
    };

    try {
        const audioContent = await makeRequest();
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent });

    } catch (error: any) {
        console.error("Speak API Error:", error);
        
        let statusCode = 500;
        let errorMessage = "Failed to generate speech.";

        if (error.message?.includes('429') || error.message?.includes('quota')) {
            statusCode = 429;
            errorMessage = "Server capacity reached or busy. Please try again later.";
        } else if (error.message?.includes('403')) {
            statusCode = 403;
            errorMessage = "Access Denied. Check API Key restrictions.";
        } else if (error.message?.includes('400')) {
            statusCode = 400;
            errorMessage = "Invalid Request: " + error.message;
        }

        return res.status(statusCode).json({ error: errorMessage, details: error.message });
    }
}
