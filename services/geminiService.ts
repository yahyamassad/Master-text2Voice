
import { SpeakerConfig } from '../types';
import { decode } from '../utils/audioUtils';

// NOTE: We now call the Vercel Serverless Functions (/api/speak, /api/translate)
// instead of using the GoogleGenAI SDK directly in the browser.
// This secures the API Key and prevents 'process is not defined' errors in Vite.

/**
 * Helper function to call the backend TTS API for a single chunk of text.
 */
async function generateAudioChunk(
    text: string,
    voice: string,
    emotion: string,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig },
    signal?: AbortSignal,
    seed?: number
): Promise<Uint8Array | null> {
    
    // Simplified instructions logic handling moved to backend or kept here for prompt construction
    let promptText = text;
    if (emotion && emotion !== 'Default') {
        promptText = `(Emotion: ${emotion}) ${text}`;
    }

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: promptText,
                voice: voice,
                speakers: speakers, // Pass speakers config to backend
                seed: seed // Pass seed if supported by backend
            }),
            signal: signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
            console.warn("API returned no audio content.");
            return null;
        }
        
        return decode(data.audioContent);

    } catch (e: any) {
        if (e.name === 'AbortError') {
            throw new Error('Aborted');
        }
        console.error("Gemini Audio Chunk Error:", e);
        throw e;
    }
}

/**
 * Generates speech from text by calling the backend API.
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
        // We handle paragraph splitting here to manage pauses correctly
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
 * Translates text using the backend API.
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
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                sourceLang,
                targetLang
            }),
            signal: signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Translation server error: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error: any) {
        if (error.name === 'AbortError') {
             throw new Error('Aborted');
        }
        console.error("Gemini Service (translateText) failed:", error);
        throw error;
    }
}

/**
 * Generates a voice preview.
 */
export async function previewVoice(
    voiceId: string,
    previewText: string,
    emotion: string,
    signal?: AbortSignal
): Promise<Uint8Array | null> {
    try {
        return await generateAudioChunk(
            previewText || "Hello", 
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
