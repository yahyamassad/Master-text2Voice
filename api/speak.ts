import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This version is TEMPORARILY simplified to isolate the root cause of the 500 error.
// It ONLY supports the single-speaker, default-emotion case, using the exact logic
// that succeeded in the /api/speak-debug test.
// Emotion and multi-speaker features are temporarily disabled.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voice } = req.body; // Only using basic parameters for now

    if (!voice) {
        return res.status(400).json({ error: 'Missing required parameter: voice is required.' });
    }
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Input text cannot be empty.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        // Using the simplified, proven-to-work structure from the debug test.
        const requestPayload = {
            model,
            contents: [{ parts: [{ text: text }] }], // Use text directly from input
            config: {
                responseModalities: ['AUDIO' as const],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        };

        const result = await ai.models.generateContent(requestPayload);
        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const finishReason = result.candidates?.[0]?.finishReason;
            console.error(`Audio generation failed. Reason: ${finishReason}`);
            throw new Error(`Could not generate audio. Model finished with reason: ${finishReason || 'UNKNOWN'}.`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: any) {
        console.error("--- ERROR IN SIMPLIFIED /api/speak ---", error);
        
        let errorMessage = error.message || "An unknown server error occurred during speech generation.";

        const lowerCaseError = errorMessage.toLowerCase();
        if (lowerCaseError.includes('api key not valid')) {
            errorMessage = 'Gemini API Error: The API key is not valid.';
        } else if (lowerCaseError.includes('billing')) {
            errorMessage = 'Gemini API Error: Billing is not enabled for the Google Cloud project.';
        } else if (lowerCaseError.includes('permission_denied')) {
             errorMessage = 'Gemini API Error: The API is not enabled in your Google Cloud project.';
        }
        
        if (!res.headersSent) {
            return res.status(500).json({ error: errorMessage });
        }
    }
}
