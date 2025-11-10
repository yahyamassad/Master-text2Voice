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

    let processedText: string;
    let instruction = ''; // Keep instruction separate

    // A helper to process a single line of text for sound effects and escaping.
    const processLine = (line: string): string => {
        let processed = escapeSsml(line);
        for (const key in soundEffectMap) {
            const regex = new RegExp(key.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'gi');
            processed = processed.replace(regex, soundEffectMap[key]);
        }
        return processed;
    };

    if (isMultiSpeaker) {
        // For multi-speaker, join lines with a break tag. NO <p> tags and NO prepended instructions.
        // The model expects a clean 'Speaker: Dialogue' format on each line.
        const breakTag = pauseDuration > 0 ? `<break time="${pauseDuration.toFixed(1)}s"/>` : '';
        processedText = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(processLine)
            .join(breakTag);
    } else {
        // For single speaker, we can safely add instructions and paragraph breaks.
        processedText = processLine(text);
        
        // Insert SSML break tags for paragraph pauses.
        if (pauseDuration > 0) {
            const breakTag = `<break time="${pauseDuration.toFixed(1)}s"/>`;
            // A more robust replacement for newlines, adding breaks for double newlines (paragraphs).
            processedText = processedText.replace(/\n\s*\n/g, `\n${breakTag}\n`);
        }

        // Add emotion instruction for single speaker mode only, as it confuses the multi-speaker parser.
        if (emotion && emotion !== 'Default') {
            instruction = `(say in a ${emotion.toLowerCase()} tone) `;
        }
    }
    
    // Assemble the final SSML payload, wrapping in <speak> and <prosody> for control.
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
