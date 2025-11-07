import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimiting } from './_lib/rate-limiter';

// A map to convert UI emotion selection to a direct prompt prefix for the model,
// aligning with documented examples for better reliability.
const emotionPromptMap: { [key: string]: string } = {
  'Happy': 'Happily: ',
  'Sad': 'Sadly: ',
  'Formal': 'Formally: '
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

    // `pauseDuration` from the body is intentionally unused. The model's natural
    // handling of paragraph breaks is more reliable than manual text manipulation.
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
        
        let promptText = text;
        const isMultiSpeaker = speakers && speakers.speakerA && speakers.speakerB;

        // --- REVISED PROMPT ENGINEERING ---
        // This logic now aligns strictly with documented examples to ensure model compatibility
        // and prevent internal server errors caused by unexpected prompt formats.
        if (isMultiSpeaker) {
            promptText = `TTS the following conversation between ${speakers.speakerA.name} and ${speakers.speakerB.name}:\n${text}`;
        } else if (emotion && emotion !== 'Default') {
            const prefix = emotionPromptMap[emotion];
            if (prefix) {
                promptText = prefix + text;
            }
        }
        // If single speaker and default emotion, the text is passed as-is, which is the correct behavior.
        // --- END REVISION ---

        const config: any = {
            responseModalities: [Modality.AUDIO],
        };

        if (isMultiSpeaker) {
            config.speechConfig = {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                        { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } },
                    ]
                }
            };
        } else {
            config.speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
        }
        
        const result = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: promptText }] }],
            config,
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
        
    } catch (error: any) {
        console.error("Full error in /api/speak:", JSON.stringify(error, null, 2));

        let errorMessage = 'An unknown server error occurred.';
        if (error.message) {
            errorMessage = error.message;
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

        return res.status(500).json({ error: errorMessage });
    }
}
