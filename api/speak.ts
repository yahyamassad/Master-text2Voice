import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimiting } from './_lib/rate-limiter';

// =================================================================================
// SSML Processing Engine - The core of the new implementation
// =================================================================================

// Maps UI sound effect tags to SSML interjections.
const soundEffectMap: { [key: string]: string } = {
    '[laugh]': '<say-as interpret-as="interjection">laugh</say-as>',
    '[laughter]': '<say-as interpret-as="interjection">laughter</say-as>',
    '[sigh]': '<say-as interpret-as="interjection">sigh</say-as>',
    '[sob]': '<say-as interpret-as="interjection">sob</say-as>',
    '[gasp]': '<say-as interpret-as="interjection">gasp</say-as>',
    '[cough]': '<say-as interpret-as="interjection">cough</say-as>',
    '[hmm]': '<say-as interpret-as="interjection">hmm</say-as>',
    '[cheer]': '<say-as interpret-as="interjection">cheer</say-as>',
    '[kiss]': '<say-as interpret-as="interjection">kiss</say-as>',
};

// Maps UI emotion settings to SSML prosody attributes.
const emotionProsodyMap: { [key: string]: { rate: string; pitch: string } } = {
    'Default': { rate: 'medium', pitch: 'medium' },
    'Happy': { rate: 'fast', pitch: 'high' },
    'Sad': { rate: 'slow', pitch: 'low' },
    'Formal': { rate: 'medium', pitch: 'medium' }, // Formality is more about diction, but we can keep prosody neutral.
    // Inline emotions
    'cheerfully': { rate: 'fast', pitch: 'high' },
    'sadly': { rate: 'slow', pitch: 'low' },
    'formally': { rate: 'medium', pitch: 'medium' },
    'angrily': { rate: 'fast', pitch: 'medium' }, // Example of future extension
    'softly': { rate: 'slow', pitch: 'low' }
};

// A simple utility to escape characters that are special in XML/SSML.
function escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (char) => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return char;
        }
    });
}

/**
 * Processes raw text with custom tags into a complete SSML string.
 * This function is the heart of the intelligent speech generation.
 * @param text The user's input text, e.g., "Hello [laugh] (sadly) I am not well."
 * @param overallEmotion The default emotion for the entire text.
 * @param pauseDuration The duration in seconds for paragraph breaks.
 * @returns A single, well-formed SSML string.
 */
function processTextToSsml(text: string, overallEmotion: string, pauseDuration: number): string {
    // Start with the default prosody based on the overall emotion setting.
    let currentProsody = emotionProsodyMap[overallEmotion] || emotionProsodyMap['Default'];
    let ssmlBody = '';
    
    // Regex to split the text by our custom tags `[...]` and `(...)`, keeping the delimiters.
    const parts = text.split(/(\[.*?\]|\(.*?\))/g).filter(p => p);

    for (const part of parts) {
        if (part.startsWith('[') && part.endsWith(']')) {
            // It's a sound effect tag, e.g., "[laugh]"
            ssmlBody += soundEffectMap[part.toLowerCase()] || '';
        } else if (part.startsWith('(') && part.endsWith(')')) {
            // It's an inline emotional cue, e.g., "(sadly)"
            const cue = part.slice(1, -1).trim().toLowerCase();
            const newProsody = emotionProsodyMap[cue];
            if (newProsody) {
                currentProsody = newProsody;
            }
            // Note: The cue itself is not spoken, it only changes the style for the next part.
        } else {
            // It's a regular piece of text.
            const cleanedPart = part.trim();
            if (cleanedPart) {
                // Wrap the text in the currently active prosody settings.
                ssmlBody += `<prosody rate="${currentProsody.rate}" pitch="${currentProsody.pitch}">${escapeXml(cleanedPart)}</prosody> `;
            }
            // After speaking this part, revert to the overall emotion's prosody.
            currentProsody = emotionProsodyMap[overallEmotion] || emotionProsodyMap['Default'];
        }
    }
    
    // Replace newlines with SSML break tags for natural pauses between paragraphs.
    const finalBodyWithPauses = ssmlBody.trim().replace(/\n+/g, `<break time="${pauseDuration}s"/>`);

    // Wrap everything in the root <speak> tag.
    return `<speak>${finalBodyWithPauses}</speak>`;
}


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
        
        // The core logic is now simplified to one SSML generation step.
        const ssmlText = processTextToSsml(text, emotion, pauseDuration);
        
        // The API configuration is now simpler.
        const config: any = {
            responseModalities: [Modality.AUDIO],
        };

        if (speakers && speakers.speakerA && speakers.speakerB) {
            // Multi-speaker mode still works by passing speaker names.
            // The model will use SSML for tone and this config for voice assignment.
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
        
        // A single, efficient API call with the complete SSML payload.
        const result = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: ssmlText }] }],
            config,
        });

        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            // Check for specific finish reasons from the model for better debugging.
            const finishReason = result.candidates?.[0]?.finishReason;
            const finishMessage = result.candidates?.[0]?.finishMessage || 'No specific message.';
            console.error(`Audio generation failed. Reason: ${finishReason}, Message: ${finishMessage}`);
            throw new Error(`Could not generate audio. Model finished with reason: ${finishReason}.`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: any) {
        console.error("Full error in /api/speak:", JSON.stringify(error, null, 2));

        let errorMessage = 'An unknown server error occurred.';
        if (error.message) {
            errorMessage = error.message;
        }

        // Provide more user-friendly error messages for common API issues
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