import { GoogleGenAI, Modality } from "@google/genai";
import { decode, generateSilence, concatenateUint8Arrays } from '../utils/audioUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type SpeechSpeed = 'slow' | 'normal' | 'fast';


export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional comments, formatting, or explanations:\n\n"${text}"`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error translating text with Gemini API:", error);
        throw new Error("GEMINI_API_ERROR");
    }
}

async function _fetchAndDecodeParagraph(text: string, voice: 'Puck' | 'Kore', speed: SpeechSpeed, languageName: string): Promise<Uint8Array | null> {
    let speedPrefix = '';
    switch (speed) {
        case 'slow':
            speedPrefix = 'Read slowly:';
            break;
        case 'fast':
            speedPrefix = 'Read quickly:';
            break;
        case 'normal':
        default:
            // For normal speed, we don't add any prefix to keep the prompt as clean as possible.
            // The model's default pace is normal.
            break;
    }

    // The Gemini TTS model is powerful but can be sensitive to complex prompts.
    // The previous prompt was too long and included multiple instructions (language, speed, intonation, pauses).
    // This can lead to internal server errors (500), as was observed.
    // A much simpler, direct prompt is more reliable. We instruct the speed (if not normal) and then provide the text.
    // The model is multilingual and should handle the language automatically from the text.
    const prompt = speedPrefix ? `${speedPrefix} ${text}` : text;

    try {
        const response = await ai.models.generateContent({
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
        throw error;
    }
}

export async function generateSpeech(text: string, voice: 'Puck' | 'Kore', speed: SpeechSpeed, languageName: string, pauseDuration: number): Promise<Uint8Array | null> {
    try {
        // Split by one or more empty lines. This robustly separates paragraphs
        // regardless of extra spaces or multiple newlines, and filters out empty entries.
        const paragraphs = text.trim().split(/\n\s*\n+/).filter(p => p.trim().length > 0);

        // If there's only one paragraph (or none), no pauses are needed.
        if (paragraphs.length <= 1) {
            const textToSpeak = paragraphs.length === 1 ? paragraphs[0] : text.trim();
            // If after all trimming, there is no text, return null.
            if (!textToSpeak) return null;
            return await _fetchAndDecodeParagraph(textToSpeak, voice, speed, languageName);
        }

        const audioChunks: Uint8Array[] = [];
        const silenceChunk = pauseDuration > 0 ? generateSilence(pauseDuration, 24000, 1) : null;

        for (const paragraph of paragraphs) {
            const speechChunk = await _fetchAndDecodeParagraph(paragraph, voice, speed, languageName);
            
            if (speechChunk) {
                // For the very first successful chunk, just add the audio.
                // For all subsequent successful chunks, add the pause *before* the audio.
                // This logic explicitly prevents any silence at the beginning of the audio track.
                if (audioChunks.length > 0 && silenceChunk) {
                    audioChunks.push(silenceChunk);
                }
                audioChunks.push(speechChunk);
            } else {
                console.warn(`Skipping failed audio generation for paragraph: "${paragraph.substring(0, 50)}..."`);
            }
        }
        
        if (audioChunks.length === 0) {
            // This happens if all paragraph generations fail.
            throw new Error("API_NO_AUDIO");
        }

        return concatenateUint8Arrays(audioChunks);

    } catch (error) {
        console.error("Error generating speech with pauses:", error);
        if (error instanceof Error && (error.message === 'API_NO_AUDIO' || error.message === 'GEMINI_API_ERROR')) {
            throw error;
        }
        throw new Error("GEMINI_API_ERROR");
    }
}
