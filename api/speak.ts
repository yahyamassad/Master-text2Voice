import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimiting } from './_lib/rate-limiter';

// REVERTING to the exact prompt phrasing from the previously working file.
// This preview model appears to be extremely sensitive to the prompt structure.
const emotionPromptMap: { [key: string]: string } = {
  'Happy': 'Say cheerfully:',
  'Sad': 'Read in a sad tone:',
  'Formal': 'Read in a formal, professional voice:',
};

// =================================================================================
// Vercel Serverless Function Handler
// =================================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await applyRateLimiting(req, res);
    } catch (error: any) {
        return res.status(429).json({ error: error.message || 'Rate limit exceeded.' });
    }

    const { text, voice, emotion, speakers } = req.body;

    if (!voice) {
        return res.status(400).json({ error: 'Missing required parameter: voice is required.' });
    }
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Input text cannot be empty.' });
    }


    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        let promptText = text; // Default to original text
        let speechConfig: any;
        
        const isMultiSpeaker = speakers && speakers.speakerA?.name?.trim() && speakers.speakerB?.name?.trim();

        if (isMultiSpeaker) {
            promptText = `TTS the following conversation between ${speakers.speakerA.name} and ${speakers.speakerB.name}:\n${text}`;
            speechConfig = {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                        { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } },
                    ]
                }
            };
        } else {
            speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
            
            // Replicating the exact prompt construction from the working file
            const instructionPrefix = (emotion && emotion !== 'Default' && emotionPromptMap[emotion])
                ? emotionPromptMap[emotion]
                : '';

            if (instructionPrefix) {
                // The newline character was present in the old working version.
                promptText = `${instructionPrefix}\n${text}`;
            }
        }
        
        const result = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                // DEFENSIVE CHANGE: Use the literal string for responseModalities to avoid any
                // potential issues with enum bundling in the serverless environment.
                responseModalities: ['AUDIO'],
                speechConfig: speechConfig,
            },
        });

        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const finishReason = result.candidates?.[0]?.finishReason;
            const finishMessage = result.candidates?.[0]?.finishMessage || 'No specific message.';
            console.error(`Audio generation failed. Reason: ${finishReason}, Message: ${finishMessage}`);
            if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
                 throw new Error(`Could not generate audio due to content policy: ${finishReason}.`);
            }
            throw new Error(`Could not generate audio. Model finished with reason: ${finishReason || 'UNKNOWN'}.`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: unknown) {
        console.error("--- ERROR IN /api/speak ---");
        let errorMessage = "An unknown server error occurred during speech generation.";

        // Safely extract error message to prevent the handler from crashing.
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error("Error Message:", error.message);
        } else {
            try {
                const errorString = JSON.stringify(error);
                errorMessage = `An unexpected error object was thrown: ${errorString}`;
                console.error("Caught non-Error object:", errorString);
            } catch (e) {
                errorMessage = "An unexpected and non-serializable error object was thrown.";
                console.error("Caught non-serializable, non-Error object.");
            }
        }

        const lowerCaseError = errorMessage.toLowerCase();
        if (lowerCaseError.includes('api key not valid')) {
            errorMessage = 'Gemini API Error: The API key provided in Vercel is not valid. Please check the `API_KEY` environment variable.';
        } else if (lowerCaseError.includes('billing')) {
            errorMessage = 'Gemini API Error: Billing is not enabled for the Google Cloud project. Please enable billing.';
        } else if (lowerCaseError.includes('permission_denied') || lowerCaseError.includes('api not enabled')) {
             errorMessage = 'Gemini API Error: The "Generative Language API" or "Vertex AI API" is not enabled in your Google Cloud project.';
        } else if (lowerCaseError.includes('rate limit')) {
             errorMessage = 'You have reached the daily character usage limit. Please try again tomorrow.';
        }
        
        // Ensure a response is always sent, preventing the function from timing out or crashing.
        if (!res.headersSent) {
            return res.status(500).json({ error: errorMessage });
        }
    }
}
