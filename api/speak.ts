import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SpeakerConfig } from '../types';

/**
 * Escapes special characters in a string to be safely used within an SSML document.
 */
function escapeSsml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * A robust function to process text and build a complete SSML string for the TTS model.
 * This ensures consistency and enables advanced features like sound effects and pauses.
 */
function preprocessAndBuildSsml(
    text: string, 
    emotion: string, 
    pauseDuration: number, 
    isMultiSpeaker: boolean
): string {
    // 1. Define mappings for bracketed cues to SSML sound effect tags.
    const soundEffectMap: { [key: string]: string } = {
        '[laugh]': '<say-as interpret-as="laugh"></say-as>',
        '[laughter]': '<say-as interpret-as="laughter"></say-as>',
        '[sigh]': '<say-as interpret-as="sigh"></say-as>',
        '[sob]': '<say-as interpret-as="sob"></say-as>',
        '[gasp]': '<say-as interpret-as="gasp"></say-as>',
        '[cough]': '<say-as interpret-as="cough"></say-as>',
        '[hmm]': '<say-as interpret-as="hmm"></say-as>',
        '[cheer]': '<say-as interpret-as="cheer"></say-as>',
        '[kiss]': '<say-as interpret-as="kiss"></say-as>',
    };

    // 2. Escape basic SSML characters first.
    let processedText = escapeSsml(text);

    // 3. Replace all bracketed cues with their corresponding SSML tags.
    for (const key in soundEffectMap) {
        const regex = new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'gi');
        processedText = processedText.replace(regex, soundEffectMap[key]);
    }

    // 4. Insert SSML break tags for pauses if specified.
    if (pauseDuration > 0) {
        const breakTag = `<break time="${pauseDuration.toFixed(1)}s"/>`;
        if (isMultiSpeaker) {
            // In multi-speaker, every newline indicates a speaker change.
            processedText = processedText.split('\n').join(`\n${breakTag}\n`);
        } else {
            // In single-speaker, a double newline indicates a paragraph break.
            processedText = processedText.replace(/\n\s*\n/g, `\n${breakTag}\n`);
        }
    }
    
    // 5. Construct vocal instructions (for tone/emotion).
    let instruction = '';
    if (emotion && emotion !== 'Default') {
        instruction = isMultiSpeaker 
            ? `(The overall tone is ${emotion.toLowerCase()}) ` 
            : `(say in a ${emotion.toLowerCase()} tone) `;
    }

    // REMOVED: The hardcoded script instruction was causing prompt leakage, especially with non-English text.
    // We now rely on the API's native multi-speaker parsing capabilities.

    // 7. Assemble the final SSML payload, wrapping in <speak> and <prosody> for control.
    // <prosody rate="medium"> ensures a consistent, normal speaking speed.
    return `<speak><prosody rate="medium">${instruction}${processedText}</prosody></speak>`;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voice, emotion, pauseDuration, speakers } = req.body as {
        text: string;
        voice: string;
        emotion: string;
        pauseDuration: number;
        speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig };
    };

    if (!voice) {
        return res.status(400).json({ error: 'Missing required parameter: voice is required.' });
    }
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Input text cannot be empty.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        const isMultiSpeaker = !!(speakers && speakers.speakerA?.name && speakers.speakerB?.name);
        
        // Determine the speech configuration based on single or multi-speaker mode.
        const speechConfig = isMultiSpeaker ? {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                    { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } }
                ]
            }
        } : {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        };

        // Process the text and build the final, robust SSML payload.
        const processedText = preprocessAndBuildSsml(text, emotion, pauseDuration, isMultiSpeaker);

        const requestPayload = {
            model,
            contents: [{ parts: [{ text: processedText }] }],
            config: {
                responseModalities: ['AUDIO' as const],
                speechConfig: speechConfig,
            },
        };

        const result = await ai.models.generateContent(requestPayload);
        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const finishReason = result.candidates?.[0]?.finishReason;
            const finishMessage = result.candidates?.[0]?.finishMessage;
            console.error(`Audio generation failed. Reason: ${finishReason}, Message: ${finishMessage}, Payload: ${JSON.stringify(requestPayload)}`);
            throw new Error(`Could not generate audio. Model finished with reason: ${finishReason || 'UNKNOWN'}. ${finishMessage || ''}`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: any) {
        console.error("--- ERROR IN /api/speak ---", error);
        
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
