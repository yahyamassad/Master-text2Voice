import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimiting } from './_lib/rate-limiter';

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

    const { text, voice, emotion, pauseDuration, speakers } = req.body;

    if (!voice) {
        return res.status(400).json({ error: 'Missing required parameter: voice is required.' });
    }
    
    // CRITICAL FIX: Prevent processing empty text, which causes a silent API failure.
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Input text cannot be empty.' });
    }


    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        let promptText = text;

        // --- CORRECTED PROMPT LOGIC ---
        // For single-speaker mode, prefix the text with a direct instruction for emotion.
        // The model is trained to understand this specific format.
        // For multi-speaker mode, the text is passed as-is, as the model uses the
        // speaker names in the text (e.g., "Yazan: ...") to differentiate voices.
        const isMultiSpeaker = speakers && speakers.speakerA && speakers.speakerB;
        if (!isMultiSpeaker && emotion && emotion !== 'Default') {
            promptText = `Say it in a ${emotion} tone: ${text}`;
        }
        // The `pauseDuration` is intentionally ignored here, as the model handles paragraph
        // breaks (double newlines) automatically with a natural pause. Forcing it via text
        // proved to be unreliable and caused errors.
        // --- END CORRECTION ---

        const config: any = {
            responseModalities: [Modality.AUDIO],
        };

        if (isMultiSpeaker) {
            // Multi-speaker config.
            config.speechConfig = {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                        { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } },
                    ]
                }
            };
        } else {
            // Single-speaker mode configuration.
            config.speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
        }
        
        const result = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: promptText }] }], // Use the correctly formatted prompt
            config,
        });

        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const finishReason = result.candidates?.[0]?.finishReason;
            const finishMessage = result.candidates?.[0]?.finishMessage || 'No specific message.';
            console.error(`Audio generation failed. Reason: ${finishReason}, Message: ${finishMessage}`);
            // Provide a more specific error if the model refused to generate audio.
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
