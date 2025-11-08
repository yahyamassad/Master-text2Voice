import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SpeakerConfig } from '../types';

/**
 * Escapes special characters in a string to be safely used within an SSML document.
 * @param text The text to escape.
 * @returns The escaped text.
 */
function escapeSsml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
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
        
        let speechConfig: any;
        let processedText = text;

        const isMultiSpeaker = speakers && speakers.speakerA && speakers.speakerB && speakers.speakerA.name && speakers.speakerB.name;

        if (isMultiSpeaker) {
            // Use the native multi-speaker configuration for better accuracy.
            speechConfig = {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                        { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } }
                    ]
                }
            };
            // For multi-speaker, emotion is handled as a general instruction in the prompt.
            if (emotion && emotion !== 'Default') {
                processedText = `(Overall tone for this dialogue is ${emotion.toLowerCase()}) \n${text}`;
            }
        } else {
            // Standard single-speaker configuration.
            speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
            
            let textToSpeak = text;
            
            // Handle emotion with a prompt-based approach.
            if (emotion && emotion !== 'Default') {
                 // The API prefers instructions like this for tone.
                textToSpeak = `(say in a ${emotion.toLowerCase()} tone) ${escapeSsml(textToSpeak)}`;
            } else {
                textToSpeak = escapeSsml(textToSpeak);
            }
            
            // Handle paragraph pauses using SSML <break> tags for explicit control.
            // A double newline is considered a paragraph break.
            if (pauseDuration > 0) {
                textToSpeak = textToSpeak.replace(/\n\s*\n/g, `\n<break time="${pauseDuration.toFixed(1)}s"/>\n`);
            }

            // Wrap the final text in <speak> tags to enable SSML processing.
            processedText = `<speak>${textToSpeak}</speak>`;
        }

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
            console.error(`Audio generation failed. Reason: ${finishReason}, Message: ${finishMessage}`);
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