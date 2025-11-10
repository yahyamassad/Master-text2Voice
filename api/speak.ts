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
        let processedText: string;

        const isMultiSpeaker = speakers && speakers.speakerA && speakers.speakerB && speakers.speakerA.name && speakers.speakerB.name;

        // Step 1: Determine Speech Config (multi-speaker or single)
        if (isMultiSpeaker) {
            speechConfig = {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        { speaker: speakers.speakerA.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } } },
                        { speaker: speakers.speakerB.name, voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } } }
                    ]
                }
            };
        } else {
            speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
        }

        // Step 2: Determine the instructional prefix for emotion/tone.
        let instruction = '';
        if (emotion && emotion !== 'Default') {
            if (isMultiSpeaker) {
                // For dialogue, it's a general instruction.
                instruction = `(Overall tone for this dialogue is ${emotion.toLowerCase()}) `;
            } else {
                // For monologue, it's a direct command.
                instruction = `(say in a ${emotion.toLowerCase()} tone) `;
            }
        }

        // Step 3: Construct the final text payload, applying SSML for pauses if needed.
        if (pauseDuration > 0) {
            // Using SSML for pauses.
            const escapedText = escapeSsml(text);
            let textWithBreaks: string;

            if (isMultiSpeaker) {
                // For multi-speaker, each line is a turn. A single newline is the separator.
                const lines = escapedText.split('\n');
                textWithBreaks = lines.join(`\n<break time="${pauseDuration.toFixed(1)}s"/>\n`);
            } else {
                // For single-speaker, a paragraph is separated by a double newline.
                textWithBreaks = escapedText.replace(/\n\s*\n/g, `\n<break time="${pauseDuration.toFixed(1)}s"/>\n`);
            }
            
            // The instruction is placed inside the <speak> tag, before the main content.
            // The instruction itself should NOT be escaped.
            processedText = `<speak>${instruction}${textWithBreaks}</speak>`;
        } else {
            // Not using SSML. Just prepend the instruction to the plain text.
            processedText = `${instruction}${text}`;
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
