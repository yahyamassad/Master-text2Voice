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
    let speedInstruction = '';
    switch (speed) {
        case 'slow':
            speedInstruction = 'Read it at a pace that is slightly slower than normal conversation.';
            break;
        case 'fast':
            speedInstruction = 'Read it at a pace that is slightly faster than normal conversation.';
            break;
        case 'normal':
        default:
            speedInstruction = 'Read it at a normal conversational pace.';
            break;
    }

    const prompt = `Read the following text in ${languageName}. ${speedInstruction} Ensure you use an interrogative intonation for questions and mark brief pauses between sentences to make the speech sound natural. The text is: "${text}"`;

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
}

export async function generateSpeech(text: string, voice: 'Puck' | 'Kore', speed: SpeechSpeed, languageName: string, pauseDuration: number): Promise<Uint8Array | null> {
    try {
        // Split by one or more empty lines
        const paragraphs = text.trim().split(/\n\s*\n+/).filter(p => p.trim().length > 0);

        // If no text or only one paragraph, use the simple path.
        if (paragraphs.length <= 1) {
            return await _fetchAndDecodeParagraph(text, voice, speed, languageName);
        }

        const audioChunks: Uint8Array[] = [];
        const silenceChunk = pauseDuration > 0 ? generateSilence(pauseDuration, 24000, 1) : null;

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const speechChunk = await _fetchAndDecodeParagraph(paragraph, voice, speed, languageName);
            
            if (speechChunk) {
                audioChunks.push(speechChunk);
            } else {
                console.warn(`Skipping failed audio generation for paragraph: "${paragraph.substring(0, 50)}..."`);
            }

            // Add silence after the paragraph, but not after the last one and only if the speech part was successful
            if (i < paragraphs.length - 1 && silenceChunk && speechChunk) {
                audioChunks.push(silenceChunk);
            }
        }
        
        if (audioChunks.length === 0) {
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
