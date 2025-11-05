import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { SpeakerConfig } from '../types';
import { decode, generateSilence, concatenateUint8Arrays } from '../utils/audioUtils';


export type SpeechSpeed = number;

interface TranslationResult {
    translatedText: string;
    speakerMapping: Record<string, string>;
}

// --- Start of Dev Mode Client-Side Logic ---

const isDev = process.env.NODE_ENV === 'development';

/**
 * Gets the API key for development mode.
 * Checks sessionStorage first, then prompts the user.
 * Throws a specific error if the key is not provided.
 */
const getApiKey = (): string => {
    const key = sessionStorage.getItem('gemini_api_key');
    if (key) {
        return key;
    }
    const newKey = prompt('DEV MODE: Please enter your Gemini API Key to proceed. It will be stored in session storage for this session only.');
    if (newKey) {
        sessionStorage.setItem('gemini_api_key', newKey);
        return newKey;
    }
    throw new Error('API_KEY_MISSING');
};


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

async function singleSpeechRequestDev(
    ai: GoogleGenAI,
    promptText: string,
    speechConfig: any,
    signal: AbortSignal,
): Promise<Uint8Array | null> {
    
    // In dev mode, we can't easily abort a fetch-like call within the SDK,
    // so we check the signal before making the call.
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig,
        },
    });

    const base64Audio = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return decode(base64Audio);
    }
    return null;
}
// --- End of Dev Mode Client-Side Logic ---


export async function translateText(
    text: string, 
    sourceLang: string, 
    targetLang: string, 
    speakerAName: string, 
    speakerBName: string, 
    signal: AbortSignal
): Promise<TranslationResult> {
    if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    // DEVELOPMENT MODE: Use client-side API call
    if (isDev) {
        try {
            const apiKey = getApiKey();
            const ai = new GoogleGenAI({ apiKey });
            const model = 'gemini-2.5-flash';

            const prompt = `Translate the following text from ${sourceLang} to ${targetLang}.
IMPORTANT: You MUST preserve the original formatting exactly, including all line breaks and any empty lines between paragraphs.
Preserve any speaker notations (like 'Speaker A:') and any special sound effect tags (like '[laugh]' or '[sigh]').

Source Text:
---
${text}
---
`;
            const result = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.2,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translatedText: { type: Type.STRING },
                            speakerMapping: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        original: { type: Type.STRING },
                                        translated: { type: Type.STRING }
                                    },
                                    required: ["original", "translated"]
                                }
                            }
                        },
                        required: ["translatedText"]
                    }
                }
            });

            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            const geminiResponseText = result.text;
            if (!geminiResponseText || geminiResponseText.trim() === '') {
                throw new Error('API returned an empty response.');
            }
            
            const parsedResult = JSON.parse(geminiResponseText);
            const speakerMappingRecord: Record<string, string> = {};
            if (parsedResult.speakerMapping) {
                for (const mapping of parsedResult.speakerMapping) {
                    speakerMappingRecord[mapping.original] = mapping.translated;
                }
            }
        
            return {
                translatedText: parsedResult.translatedText,
                speakerMapping: speakerMappingRecord
            };

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            if (error instanceof Error && error.message === 'API_KEY_MISSING') throw error;
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            throw new Error(`Translation failed: ${errorMessage}`);
        }

    // PRODUCTION MODE: Use serverless function
    } else {
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, sourceLang, targetLang }),
                signal: signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const result: TranslationResult = await response.json();
            return result;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            throw new Error(`Translation failed: ${errorMessage}`);
        }
    }
}


export async function generateSpeech(
    text: string,
    voice: string,
    speed: SpeechSpeed,
    languageName: string,
    pauseDuration: number,
    emotion: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig } | undefined,
    signal: AbortSignal
): Promise<Uint8Array | null> {
    if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    // DEVELOPMENT MODE: Use client-side API call
    if (isDev) {
        try {
            const apiKey = getApiKey();
            const ai = new GoogleGenAI({ apiKey });
            
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
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    const p = paragraphs[i];
                    const processedParagraph = processSsmlTags(p);
                    const adverb = getEmotionAdverb(emotion);
                    const promptForParagraph = isMultiSpeaker ? processedParagraph : (adverb ? `Say ${adverb}: ${processedParagraph}` : processedParagraph);
                    
                    const pcmData = await singleSpeechRequestDev(ai, promptForParagraph, speechConfig, signal);
                    if (pcmData) {
                        audioChunks.push(pcmData);
                        if (i < paragraphs.length - 1) {
                            audioChunks.push(silenceChunk);
                        }
                    }
                }
                if(audioChunks.length > 0) {
                    finalPcmData = concatenateUint8Arrays(audioChunks);
                }
            } else {
                 finalPcmData = await singleSpeechRequestDev(ai, promptText, speechConfig, signal);
            }
            
            return finalPcmData;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            if (error instanceof Error && error.message === 'API_KEY_MISSING') throw error;
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            throw new Error(`Speech generation failed: ${errorMessage}`);
        }
        
    // PRODUCTION MODE: Use serverless function
    } else {
        try {
            const response = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice, speed, languageName, pauseDuration, emotion, speakers }),
                signal: signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }
            
            const audioData = await response.arrayBuffer();
            if (audioData.byteLength === 0) return null;
            return new Uint8Array(audioData);

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            throw new Error(`Speech generation failed: ${errorMessage}`);
        }
    }
}

export async function previewVoice(voice: string, sampleText: string, signal: AbortSignal): Promise<Uint8Array | null> {
    // This function can remain simple, as the backend handles the default values.
    // The hybrid logic in generateSpeech will be automatically used.
    return generateSpeech(sampleText, voice, 1.0, 'English', 0, 'Default', undefined, signal);
}
