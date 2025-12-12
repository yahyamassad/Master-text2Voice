
import { SpeakerConfig, GEMINI_VOICES } from '../types';
import { decode } from '../utils/audioUtils';
import { getVoiceStyle } from '../utils/voiceStyles';
// Removed fallback imports to enforce strict mode as requested
// import { getFallbackVoice } from './fallbackService'; 
// import { generateStandardSpeech } from './standardVoiceService'; 

// NOTE: We now call the Vercel Serverless Functions (/api/speak, /api/translate)
// instead of using the GoogleGenAI SDK directly in the browser.

/**
 * Helper to pause execution for a set time (used for Rate Limit protection).
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to call the backend TTS API for a single chunk of text.
 */
async function generateAudioChunk(
    text: string,
    voice: string,
    emotion: string,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    signal?: AbortSignal,
    seed?: number
): Promise<Uint8Array | null> {
    
    // Inject Style Prompt if 'emotion' is actually a Style ID
    let promptText = text;
    
    // Check if the 'emotion' matches one of our new Voice Styles
    if (emotion && emotion !== 'Default') {
        const style = getVoiceStyle(emotion);
        if (style) {
            promptText = `[Instruction: ${style.prompt}] ${text}`;
        } else {
            promptText = `(Emotion: ${emotion}) ${text}`;
        }
    }

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: promptText,
                voice: voice,
                speakers: speakers, 
                seed: seed 
            }),
            signal: signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Pass the specific error message from the backend (e.g. Safety Block)
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
 * Helper to escape special characters for Regex
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates speech from text by calling the backend API.
 */
export async function generateSpeech(
    text: string,
    voice: string,
    emotion: string,
    pauseDuration: number,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    signal?: AbortSignal,
    idToken?: string, 
    speed: number = 1.0, 
    seed?: number
): Promise<Uint8Array | null> {
    
    try {
        const PARAGRAPH_DELIMITER = speakers ? /\r?\n/ : /\r?\n\s*\r?\n/;

        // Split paragraphs first
        let paragraphs = text.split(PARAGRAPH_DELIMITER)
                               .map(p => p.trim())
                               .filter(p => p.length > 0);

        if (paragraphs.length === 0) return null;

        const audioChunks: Uint8Array[] = [];

        for (let i = 0; i < paragraphs.length; i++) {
            if (signal?.aborted) throw new Error('Aborted');

            const p = paragraphs[i];
            let currentText = p;
            let currentVoice = voice;
            let chunkSpeakers = speakers; 

            // --- MULTI-SPEAKER MAPPING LOGIC ---
            if (speakers) {
                const nameA = speakers.speakerA.name.trim();
                const nameB = speakers.speakerB.name.trim();
                const nameC = speakers.speakerC?.name.trim();
                const nameD = speakers.speakerD?.name.trim();
                
                const regexA = new RegExp(`^${escapeRegExp(nameA)}\\s*:\\s*`, 'i');
                const regexB = new RegExp(`^${escapeRegExp(nameB)}\\s*:\\s*`, 'i');
                const regexC = nameC ? new RegExp(`^${escapeRegExp(nameC)}\\s*:\\s*`, 'i') : null;
                const regexD = nameD ? new RegExp(`^${escapeRegExp(nameD)}\\s*:\\s*`, 'i') : null;

                if (regexA.test(p)) {
                    currentVoice = speakers.speakerA.voice;
                    // FIX: If assigned voice is not valid Gemini (e.g. user kept Azure settings), force distinct Male default
                    if (!GEMINI_VOICES.includes(currentVoice)) currentVoice = 'Puck'; 
                    currentText = p.replace(regexA, '').trim(); 
                    chunkSpeakers = undefined; 
                } else if (regexB.test(p)) {
                    currentVoice = speakers.speakerB.voice;
                    // FIX: If assigned voice is not valid Gemini, force distinct Female default
                    if (!GEMINI_VOICES.includes(currentVoice)) currentVoice = 'Kore'; 
                    currentText = p.replace(regexB, '').trim();
                    chunkSpeakers = undefined; 
                } else if (regexC && regexC.test(p) && speakers.speakerC) {
                    currentVoice = speakers.speakerC.voice;
                    // FIX: Fallback C -> Zephyr (Female)
                    if (!GEMINI_VOICES.includes(currentVoice)) currentVoice = 'Zephyr';
                    currentText = p.replace(regexC, '').trim();
                    chunkSpeakers = undefined;
                } else if (regexD && regexD.test(p) && speakers.speakerD) {
                    currentVoice = speakers.speakerD.voice;
                    // FIX: Fallback D -> Fenrir (Male)
                    if (!GEMINI_VOICES.includes(currentVoice)) currentVoice = 'Fenrir';
                    currentText = p.replace(regexD, '').trim();
                    chunkSpeakers = undefined;
                }
            }

            // Skip empty lines
            if (!currentText) continue;

            // --- FINAL FALLBACK ---
            // If we are here, currentVoice implies the main narrator voice or a successfully mapped speaker.
            // If it is STILL invalid (e.g. main voice is Azure but we called this service), default to Puck.
            if (!GEMINI_VOICES.includes(currentVoice)) {
                currentVoice = GEMINI_VOICES.includes(voice) ? voice : 'Puck';
            }

            // DIRECT CALL - NO FALLBACK WRAPPER
            // If this fails, the error bubbles up to the UI so the user sees "Safety Block" or "Overloaded"
            // instead of getting Azure voice unexpectedly.
            const chunk = await generateAudioChunk(currentText, currentVoice, emotion, chunkSpeakers, signal, seed);
            if (chunk) audioChunks.push(chunk);

            // Safety Delay
            if (i < paragraphs.length - 1) {
                await delay(800); 
            }
        }

        // Stitching logic
        const bytesPerSecond = 48000; // 24k samples * 2 bytes
        const silenceLengthBytes = Math.floor(bytesPerSecond * pauseDuration);
        const alignedSilenceLength = silenceLengthBytes % 2 === 0 ? silenceLengthBytes : silenceLengthBytes + 1;
        const silenceBuffer = new Uint8Array(alignedSilenceLength).fill(0);

        let totalSize = 0;
        if (audioChunks.length === 0) return null;

        audioChunks.forEach((chunk, index) => {
            totalSize += chunk.length;
            if (index < audioChunks.length - 1) {
                totalSize += alignedSilenceLength;
            }
        });

        const resultBuffer = new Uint8Array(totalSize);
        let offset = 0;

        audioChunks.forEach((chunk, index) => {
            resultBuffer.set(chunk, offset);
            offset += chunk.length;

            if (index < audioChunks.length - 1) {
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

/**
 * Calls the backend to enhance text (e.g. add Tashkeel)
 */
export async function addDiacritics(text: string): Promise<string> {
    try {
        const response = await fetch('/api/enhance-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, type: 'tashkeel' })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to enhance text');
        }

        const data = await response.json();
        return data.enhancedText;
    } catch (error) {
        console.error("Enhance Text Failed:", error);
        throw error;
    }
}
