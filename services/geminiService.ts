import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decode } from '../utils/audioUtils';

export type SpeechSpeed = number;
export interface SpeakerConfig {
    name: string;
    voice: string;
}

interface TranslationResult {
    translatedText: string;
    speakerMapping: Record<string, string>;
}

// Initialize the Gemini client directly on the client-side.
// This is secure in the AI Studio environment which injects the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function translateText(text: string, sourceLang: string, targetLang: string, speakerAName: string, speakerBName: string, signal: AbortSignal): Promise<TranslationResult> {
    const model = 'gemini-2.5-flash';
    const originalSpeakerNames = [speakerAName, speakerBName].filter(name => name && name.trim() !== '');

    const prompt = `Translate the following dialogue from ${sourceLang} to ${targetLang}, preserving empty newlines.
Also, provide a mapping of the original speaker names to their translated versions as an array of objects.

Original Speaker Names: ${JSON.stringify(originalSpeakerNames)}

Source Text:
"${text}"`;

    // The AbortSignal from the fetch API is not directly compatible with the genAI SDK.
    // We handle abortion in the UI logic by simply not proceeding.
    const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.1,
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translatedText: {
                        type: Type.STRING,
                        description: "The full translated dialogue, preserving the original formatting including speaker names and newlines."
                    },
                    speakerMapping: {
                        type: Type.ARRAY,
                        description: "An array of objects mapping original speaker names to their translated versions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING, description: "The original speaker name." },
                                translated: { type: Type.STRING, description: "The translated speaker name." }
                            },
                            required: ["original", "translated"]
                        }
                    }
                },
                required: ["translatedText", "speakerMapping"]
            }
        }
    });

    const geminiResponseText = result.text;

    if (!geminiResponseText || geminiResponseText.trim() === '') {
        console.error('Error: Gemini translation returned an empty response.');
        throw new Error("API_ERROR");
    }

    const parsedResult: { translatedText: string; speakerMapping: { original: string, translated: string }[] } = JSON.parse(geminiResponseText);

    // Convert array back to the record format expected by the app
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
}

// A unified function for speech generation, used by both main playback and previews.
async function performSpeechGeneration(
    text: string,
    voice: string,
    speed: SpeechSpeed,
    emotion: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig } | undefined,
    isPreview: boolean,
    signal: AbortSignal
): Promise<Uint8Array | null> {
    if (signal.aborted) {
        throw new Error('AbortError');
    }
    
    let speechConfig: any;

    if (!isPreview && speakers && speakers.speakerA?.name?.trim() && speakers.speakerB?.name?.trim()) {
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    {
                        speaker: speakers.speakerA.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } }
                    },
                    {
                        speaker: speakers.speakerB.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } }
                    }
                ]
            }
        };
    } else {
        speechConfig = {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
        };
    }

    let promptText = text;
    if (!isPreview) {
        let instructionPrefix = '';
        const emotionMap: { [key: string]: string } = {
            'Happy': 'Say cheerfully:',
            'Sad': 'Read in a sad tone:',
            'Formal': 'Read in a formal, professional voice:',
        };
        if (emotion !== 'Default' && emotionMap[emotion]) {
            instructionPrefix = emotionMap[emotion];
        }

        let speedInstruction = '';
        if (speed < 0.8) speedInstruction = 'Read very slowly:';
        else if (speed < 1.0) speedInstruction = 'Read slowly:';
        else if (speed > 1.2) speedInstruction = 'Read very quickly:';
        else if (speed > 1.0) speedInstruction = 'Read quickly:';
        
        if (instructionPrefix && speedInstruction) {
            instructionPrefix = `${instructionPrefix.slice(0, -1)} and ${speedInstruction.toLowerCase()}`;
        } else {
            instructionPrefix = instructionPrefix || speedInstruction;
        }
        
        if (instructionPrefix) {
            promptText = `${instructionPrefix}\n${text}`;
        }
    }
    
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
    
    console.error('Failed to generate audio content from Gemini API.');
    return null;
}


export async function generateSpeech(
    text: string,
    voice: string,
    speed: SpeechSpeed,
    languageName: string, // languageName is not directly used by TTS API but kept for signature consistency
    pauseDuration: number, // pauseDuration is handled by client-side logic now
    emotion: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig } | undefined,
    signal: AbortSignal
): Promise<Uint8Array | null> {
    return performSpeechGeneration(text, voice, speed, emotion, speakers, false, signal);
}

export async function previewVoice(voice: string, sampleText: string, signal: AbortSignal): Promise<Uint8Array | null> {
    // For previews, we pass default values for speed/emotion and no speakers.
    return performSpeechGeneration(sampleText, voice, 1.0, 'Default', undefined, true, signal);
}
