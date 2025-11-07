import { Buffer } from "buffer";
import { GoogleGenAI, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit } from './_lib/rate-limiter';

// --- Start of utility functions (self-contained for serverless environment) ---

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function generateSilence(duration: number, sampleRate: number, numChannels: number): Uint8Array {
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const numFrames = Math.floor(duration * sampleRate);
    const bufferSize = numFrames * numChannels * bytesPerSample;
    return new Uint8Array(bufferSize);
}

function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

function getEmotionAdverb(emotion: string): string {
    switch (emotion) {
        case "Happy": return "cheerfully";
        case "Sad": return "sadly";
        case "Formal": return "formally";
        default: return "";
    }
}

function processSsmlTags(text: string): string {
    const ssmlMap: Record<string, string> = {
        '\\[laugh\\]': '<say-as interpret-as="interjection">haha</say-as>',
        '\\[laughter\\]': '<say-as interpret-as="interjection">laughter</say-as>',
        '\\[sigh\\]': '<say-as interpret-as="interjection">sigh</say-as>',
        '\\[sob\\]': '<say-as interpret-as="interjection">sob</say-as>',
        '\\[gasp\\]': '<say-as interpret-as="interjection">gasp</say-as>',
        '\\[cough\\]': '<say-as interpret-as="interjection">cough</say-as>',
        '\\[hmm\\]': '<say-as interpret-as="interjection">hmm</say-as>',
        '\\[cheer\\]': '<say-as interpret-as="interjection">hurray</say-as>',
        '\\[kiss\\]': '<say-as interpret-as="interjection">kiss</say-as>',
    };

    let processedText = text;
    for (const tag in ssmlMap) {
        processedText = processedText.replace(new RegExp(tag, 'gi'), ssmlMap[tag]);
    }
    return processedText;
}

async function singleSpeechRequest(
    ai: GoogleGenAI,
    promptText: string,
    speechConfig: any,
): Promise<Uint8Array> {
    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig,
        },
    });

    const candidate = geminiResponse.candidates?.[0];
    const base64Audio = candidate?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
        return decode(base64Audio);
    }
    
    // If no audio, log the response for debugging and throw an error.
    console.error("Gemini API did not return audio. Full response:", JSON.stringify(geminiResponse, null, 2));
    
    let reason = "The API returned a valid response, but it did not contain audio data.";
    if (geminiResponse.promptFeedback?.blockReason) {
        reason = `Request was blocked by the API. Reason: ${geminiResponse.promptFeedback.blockReason}`;
    } else if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        reason = `Content generation finished for an unexpected reason: ${candidate.finishReason}`;
    } else if (!candidate) {
        reason = "The API response contained no valid candidates. This might be due to a safety block or an issue with the prompt.";
    }

    throw new Error(reason);
}

// --- End of utility functions ---


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voice, pauseDuration, emotion, speakers } = req.body;

    if (!text || !voice) {
        return res.status(400).json({ error: 'Missing required parameters: text and voice are required.' });
    }
    
    // Enforce rate limiting before processing the request
    const charCount = text.length;
    const { isRateLimited, currentUsage, limit } = await checkRateLimit(req, charCount);

    // Set headers on every response to keep the client updated
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Used', currentUsage);
    
    if (isRateLimited) {
        return res.status(429).json({ error: 'You have exceeded the daily usage limit. Please try again tomorrow.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let speechConfig: any;
        let promptText = text;

        const isMultiSpeaker = speakers?.speakerA?.name?.trim() && speakers?.speakerB?.name?.trim();

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
            const adverb = getEmotionAdverb(emotion);
            const processedTextForEmotion = processSsmlTags(text);
            if (adverb) {
                promptText = `Say ${adverb}: ${processedTextForEmotion}`;
            } else {
                promptText = processedTextForEmotion;
            }
            speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            };
        }
        
        let finalPcmData: Uint8Array | null = null;
        
        const paragraphs = text.split(/\n+/).filter((p: string) => p.trim() !== '');
        const numericPauseDuration = Number(pauseDuration);

        if (numericPauseDuration > 0 && paragraphs.length > 1) {
            const audioChunks: Uint8Array[] = [];
            const silenceChunk = generateSilence(numericPauseDuration, 24000, 1);

            for (let i = 0; i < paragraphs.length; i++) {
                const p = paragraphs[i];
                const processedParagraph = processSsmlTags(p);
                const adverb = getEmotionAdverb(emotion);
                const promptForParagraph = isMultiSpeaker ? processedParagraph : (adverb ? `Say ${adverb}: ${processedParagraph}` : processedParagraph);
                
                const pcmData = await singleSpeechRequest(ai, promptForParagraph, speechConfig);
                audioChunks.push(pcmData);
                if (i < paragraphs.length - 1) {
                    audioChunks.push(silenceChunk);
                }
            }
            if(audioChunks.length > 0) {
                finalPcmData = concatenateUint8Arrays(audioChunks);
            }
        } else {
             finalPcmData = await singleSpeechRequest(ai, promptText, speechConfig);
        }

        if (finalPcmData) {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', finalPcmData.length);
            return res.status(200).send(Buffer.from(finalPcmData));
        } else {
            return res.status(500).json({ error: 'API did not return audio content, and no specific reason was found.' });
        }

    } catch (error: any) {
        console.error("Error in /api/speak:", error);
        return res.status(500).json({ error: error.message || 'An unknown server error occurred.' });
    }
}
