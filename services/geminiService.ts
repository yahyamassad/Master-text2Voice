import { GoogleGenAI, Modality } from "@google/genai";
import { decode, generateSilence, concatenateUint8Arrays } from '../utils/audioUtils';

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents the application from crashing on startup if the API key is missing
 * by moving the initialization to the first actual API call.
 */
function getAiClient(): GoogleGenAI {
    if (!ai) {
        if (!process.env.API_KEY) {
            const message = "Gemini API key is not configured. The app cannot function without it.";
            console.error(message);
            // Throw a consistent error type that the UI can catch and display.
            throw new Error("GEMINI_API_ERROR");
        }
        try {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI:", e);
            throw new Error("GEMINI_API_ERROR");
        }
    }
    return ai;
}


export type SpeechSpeed = number; // Represents playback rate, e.g., 1.0 is normal

// New interface for multi-speaker configuration
export interface SpeakerConfig {
    name: string;
    voice: string;
}

interface TranslationResult {
    translatedText: string;
    speakerMapping: Record<string, string>;
}

// Helper to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function translateText(text: string, sourceLang: string, targetLang: string, speakerAName: string, speakerBName: string): Promise<TranslationResult> {
    try {
        const client = getAiClient();
        const model = 'gemini-2.5-flash';
        const originalSpeakerNames = [speakerAName, speakerBName].filter(name => name.trim() !== '');
        
        const prompt = `You are an expert translation assistant. Your task is to translate a dialogue and provide a mapping of the speaker names.
You must adhere to the following rules:
1. Respond ONLY with a single, valid JSON object and nothing else.
2. The JSON object must have two keys: "translatedText" and "speakerMapping".
3. The "translatedText" value must be a string containing the full translated dialogue, preserving the 'Name: dialogue' format.
4. CRITICAL: You MUST preserve any empty newlines from the source text in your translated output to maintain conversational pacing.
5. The "speakerMapping" value must be an object where keys are the original speaker names and values are their correctly translated or transliterated versions in the target language. It MUST contain a mapping for every name provided in "Original Speaker Names".

Source Language: ${sourceLang}
Target Language: ${targetLang}
Original Speaker Names: ${JSON.stringify(originalSpeakerNames)}

Source Text:
"${text}"`;

        const response = await client.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // The response text should be a valid JSON string.
        const result = JSON.parse(response.text) as TranslationResult;
        
        // Basic validation of the returned object
        if (typeof result.translatedText !== 'string' || typeof result.speakerMapping !== 'object') {
             throw new Error("Invalid JSON structure from translation API");
        }

        return result;

    } catch (error) {
        console.error("Error translating text with Gemini API:", error);
        throw new Error("GEMINI_API_ERROR");
    }
}

async function _fetchAndDecodeParagraph(text: string, voice: string, speed: SpeechSpeed, languageName: string, emotion: string): Promise<Uint8Array | null> {
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
    if (speed < 0.8) {
        speedInstruction = 'Read very slowly:';
    } else if (speed < 1.0) {
        speedInstruction = 'Read slowly:';
    } else if (speed > 1.2) {
        speedInstruction = 'Read very quickly:';
    } else if (speed > 1.0) {
        speedInstruction = 'Read quickly:';
    }

    // Combine instructions if both exist
    if (instructionPrefix && speedInstruction) {
        // Remove the colon from the first instruction to combine them naturally
        instructionPrefix = `${instructionPrefix.slice(0, -1)} and ${speedInstruction.toLowerCase()}`;
    } else {
        instructionPrefix = instructionPrefix || speedInstruction;
    }


    const prompt = instructionPrefix ? `${instructionPrefix} ${text}` : text;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
            return decode(base64Audio);
        } else {
            console.error("No audio data in API response for paragraph:", text);
            return null;
        }
    } catch(error) {
        console.error(`Gemini API call failed for paragraph "${text.substring(0, 50)}..."`, error);
        // Re-throw the original error to be handled by the `generateSpeech` function,
        // which will set the appropriate error message for the user.
        throw new Error(`GEMINI_API_ERROR: ${error}`);
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
    onChunkReady?: (chunk: Uint8Array) => void,
    stopSignal?: React.MutableRefObject<boolean>
): Promise<Uint8Array | null> {
    const allAudioChunks: Uint8Array[] = [];

    try {
        if (speakers && speakers.speakerA.name.trim() && speakers.speakerB.name.trim()) {
            const nameA = speakers.speakerA.name.trim();
            const voiceA = speakers.speakerA.voice;
            const nameB = speakers.speakerB.name.trim();
            const voiceB = speakers.speakerB.voice;

            const regexA = new RegExp(`^\\s*${escapeRegExp(nameA)}\\s*:\\s*(.+)`, 'i');
            const regexB = new RegExp(`^\\s*${escapeRegExp(nameB)}\\s*:\\s*(.+)`, 'i');
            
            const lines = text.trim().split('\n');
            const silenceChunk = pauseDuration > 0 ? generateSilence(pauseDuration, 24000, 1) : null;
            let lastLineWasText = false;

            for (const line of lines) {
                if (stopSignal?.current) return concatenateUint8Arrays(allAudioChunks);
                const trimmedLine = line.trim();
                
                if (trimmedLine.length === 0) {
                    if (lastLineWasText && silenceChunk) {
                        onChunkReady?.(silenceChunk);
                        allAudioChunks.push(silenceChunk);
                    }
                    lastLineWasText = false;
                    continue;
                }

                const matchA = trimmedLine.match(regexA);
                const matchB = trimmedLine.match(regexB);
                
                let lineText: string | null = null;
                let lineVoice: string | null = null;

                if (matchA && matchA[1]) {
                    lineText = matchA[1].trim();
                    lineVoice = voiceA;
                } else if (matchB && matchB[1]) {
                    lineText = matchB[1].trim();
                    lineVoice = voiceB;
                } else {
                    lineText = trimmedLine;
                    lineVoice = voice;
                }

                if (lineText && lineVoice) {
                    const speechChunk = await _fetchAndDecodeParagraph(lineText, lineVoice, speed, languageName, emotion);
                    if (speechChunk) {
                        // FIX: Corrected variable name from `audioChunks` to `allAudioChunks`.
                        if (lastLineWasText && allAudioChunks.length > 0) {
                           const shortPause = generateSilence(0.2, 24000, 1);
                           onChunkReady?.(shortPause);
                           allAudioChunks.push(shortPause);
                        }
                        onChunkReady?.(speechChunk);
                        allAudioChunks.push(speechChunk);
                        lastLineWasText = true;
                    }
                }
            }
        } else {
            const paragraphs = text.trim().split(/\n\s*\n+/).filter(p => p.trim().length > 0);
            if (paragraphs.length === 0 && text.trim()) {
                paragraphs.push(text.trim());
            }

            const silenceChunk = pauseDuration > 0 ? generateSilence(pauseDuration, 24000, 1) : null;

            for (let i = 0; i < paragraphs.length; i++) {
                if (stopSignal?.current) return concatenateUint8Arrays(allAudioChunks);
                const paragraph = paragraphs[i];
                
                const speechChunk = await _fetchAndDecodeParagraph(paragraph, voice, speed, languageName, emotion);
                if (speechChunk) {
                    if (i > 0 && silenceChunk) {
                        onChunkReady?.(silenceChunk);
                        allAudioChunks.push(silenceChunk);
                    }
                    onChunkReady?.(speechChunk);
                    allAudioChunks.push(speechChunk);
                } else {
                    console.warn(`Skipping failed audio generation for paragraph: "${paragraph.substring(0, 50)}..."`);
                }
            }
        }
        
        if (allAudioChunks.length === 0) {
            throw new Error("API_NO_AUDIO");
        }
        return concatenateUint8Arrays(allAudioChunks);

    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
           throw error;
        }
        throw new Error("GEMINI_API_ERROR: An unknown error occurred during speech generation.");
    }
}


/**
 * Generates a short audio sample for a given voice.
 * Used for the voice preview feature.
 */
export async function previewVoice(voice: string, sampleText: string): Promise<Uint8Array | null> {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: sampleText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio ? decode(base64Audio) : null;
        
    } catch (error) {
        console.error(`Failed to preview voice ${voice}:`, error);
        throw new Error("VOICE_PREVIEW_FAILED");
    }
}
