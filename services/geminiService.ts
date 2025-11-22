
import { GoogleGenAI } from "@google/genai";
import { SpeakerConfig } from '../types';
import { decode } from '../utils/audioUtils';

// Initialize the client directly with the provided API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to call Gemini TTS for a single chunk of text.
 */
async function generateAudioChunk(
    text: string,
    voice: string,
    emotion: string,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig },
    signal?: AbortSignal,
    seed?: number
): Promise<Uint8Array | null> {
    
    // Simplified instructions to avoid confusing the model
    let promptText = text;
    if (emotion && emotion !== 'Default') {
        // Prepend emotion as a simple instruction
        promptText = `(Emotion: ${emotion}) ${text}`;
    }

    // Ensure we are using the exact strings required by the API
    // The model expects exact casing
    const validVoices = ['Puck', 'Kore', 'Charon', 'Zephyr', 'Fenrir'];
    const selectedVoice = validVoices.find(v => v.toLowerCase() === voice.toLowerCase()) || 'Puck';

    const config: any = {
            responseModalities: ['AUDIO'],
            speechConfig: {},
    };

    if (seed !== undefined && seed !== null) {
        // config.seed = seed; // Currently causing issues with audio stability on some endpoints, disabling for now
    }

    if (speakers) {
        config.speechConfig.multiSpeakerVoiceConfig = {
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
        };
    } else {
        config.speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: selectedVoice }
        };
    }

    if (signal?.aborted) throw new Error('Aborted');

    try {
        const responsePromise = ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: {
                role: 'user',
                parts: [{ text: promptText }]
            },
            config: config
        });

        const response: any = await Promise.race([
            responsePromise,
            new Promise((_, reject) => {
                if (signal) {
                    signal.addEventListener('abort', () => reject(new Error('Aborted')));
                }
            })
        ]);

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            console.warn(`Gemini returned no audio for voice: ${voice}. Finish reason: ${response.candidates?.[0]?.finishReason}`);
            return null;
        }
        
        return decode(base64Audio);
    } catch (e) {
        console.error("Gemini Audio Chunk Error:", e);
        throw e;
    }
}

/**
 * Generates speech from text using Gemini API directly.
 */
export async function generateSpeech(
    text: string,
    voice: string,
    emotion: string,
    pauseDuration: number,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig },
    signal?: AbortSignal,
    idToken?: string, 
    speed: number = 1.0, 
    seed?: number
): Promise<Uint8Array | null> {
    
    try {
        // We simply send the text as one chunk if it's reasonable length to avoid join artifacts
        // unless pauseDuration > 0 which requires explicit silence insertion
        const PARAGRAPH_DELIMITER = /\r?\n\s*\r?\n/;

        if (pauseDuration <= 0.1 || !PARAGRAPH_DELIMITER.test(text)) {
             return await generateAudioChunk(text, voice, emotion, speakers, signal, seed);
        }

        const paragraphs = text.split(PARAGRAPH_DELIMITER)
                               .map(p => p.trim())
                               .filter(p => p.length > 0);

        if (paragraphs.length <= 1) {
             return await generateAudioChunk(text, voice, emotion, speakers, signal, seed);
        }

        const audioPromises = paragraphs.map(p => generateAudioChunk(p, voice, emotion, speakers, signal, seed));
        const audioChunks = await Promise.all(audioPromises);

        // Gemini is strictly 24000Hz
        const bytesPerSecond = 48000; // 24k samples * 2 bytes
        const silenceLengthBytes = Math.floor(bytesPerSecond * pauseDuration);
        const alignedSilenceLength = silenceLengthBytes % 2 === 0 ? silenceLengthBytes : silenceLengthBytes + 1;
        const silenceBuffer = new Uint8Array(alignedSilenceLength).fill(0);

        let totalSize = 0;
        const validChunks = audioChunks.filter(c => c !== null) as Uint8Array[];
        
        if (validChunks.length === 0) return null;

        validChunks.forEach((chunk, index) => {
            totalSize += chunk.length;
            if (index < validChunks.length - 1) {
                totalSize += alignedSilenceLength;
            }
        });

        const resultBuffer = new Uint8Array(totalSize);
        let offset = 0;

        validChunks.forEach((chunk, index) => {
            resultBuffer.set(chunk, offset);
            offset += chunk.length;

            if (index < validChunks.length - 1) {
                resultBuffer.set(silenceBuffer, offset);
                offset += alignedSilenceLength;
            }
        });

        return resultBuffer;

    } catch (error: any) {
        if (error.message === 'Aborted' || error.name === 'AbortError') {
             throw error;
        }
        console.error("Gemini Service (generateSpeech) failed:", error);
        throw error;
    }
}

/**
 * Translates text using Gemini API directly.
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    speakerAName: string,
    speakerBName: string,
    signal?: AbortSignal,
    idToken?: string 
): Promise<{ translatedText: string, speakerMapping: Record<string, string> }> {
     
    try {
        const systemInstruction = `You are a professional translator. Translate user input from ${sourceLang} to ${targetLang}. Output ONLY the translated text.`;
        
        if (signal?.aborted) throw new Error('Aborted');

        const responsePromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
            }
        });

        const response: any = await Promise.race([
            responsePromise,
            new Promise((_, reject) => {
                if (signal) {
                    signal.addEventListener('abort', () => reject(new Error('Aborted')));
                }
            })
        ]);

        let translatedText = response.text;
        if (!translatedText && response.candidates?.[0]?.content?.parts?.[0]?.text) {
            translatedText = response.candidates[0].content.parts[0].text;
        }

        if (!translatedText) {
            throw new Error("Translation returned empty response.");
        }

        let cleanText = translatedText.trim();
        cleanText = cleanText.replace(/^```(json)?/i, '').replace(/```$/, '');

        return { translatedText: cleanText, speakerMapping: {} };

    } catch (error: any) {
        if (error.message === 'Aborted' || error.name === 'AbortError') {
             throw error;
        }
        console.error("Gemini Service (translateText) failed:", error);
        throw error;
    }
}

/**
 * Generates a voice preview using Gemini API directly.
 */
export async function previewVoice(
    voiceId: string,
    previewText: string,
    emotion: string,
    signal?: AbortSignal
): Promise<Uint8Array | null> {
    
    // Use the text provided (which is localized in SettingsModal)
    // Removed hardcoded "Hello" check to verify actual generation works.
    const textToSpeak = previewText || "Hello";

    try {
        return await generateAudioChunk(
            textToSpeak, 
            voiceId, 
            emotion, 
            undefined, 
            signal
        );
    } catch (error) {
        console.error("Gemini Service (previewVoice) failed:", error);
        throw error;
    }
}
