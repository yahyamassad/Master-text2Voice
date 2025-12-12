
import { SpeakerConfig } from '../types';
import { decode } from '../utils/audioUtils';
import { getVoiceStyle } from '../utils/voiceStyles';

// NOTE: We now call the Vercel Serverless Functions (/api/speak, /api/translate)
// instead of using the GoogleGenAI SDK directly in the browser.
// This secures the API Key and prevents 'process is not defined' errors in Vite.

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
    // If it's a simple legacy emotion (Happy, Sad), we use the old format.
    // If it's a Style ID (epic_poet, news_anchor), we prepend the full prompt instruction.
    if (emotion && emotion !== 'Default') {
        const style = getVoiceStyle(emotion);
        if (style) {
            // It's a Persona!
            promptText = `[Instruction: ${style.prompt}] ${text}`;
        } else {
            // Legacy basic emotion
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
        // CRITICAL FIX FOR MULTI-SPEAKER PARSING:
        // If multi-speaker mode is active (`speakers` is defined), we MUST split by SINGLE newline (\n).
        // This ensures that adjacent lines like:
        // "Yazan: Hello"
        // "Lana: Hi"
        // ...are treated as separate chunks, allowing the code to detect the speaker at the start of the line.
        //
        // If it's single speaker mode, we stick to the Double Newline (\n\n) rule to allow users 
        // to format paragraphs without forcing a pause at every line break.
        const PARAGRAPH_DELIMITER = speakers ? /\r?\n/ : /\r?\n\s*\r?\n/;

        // Split paragraphs first
        let paragraphs = text.split(PARAGRAPH_DELIMITER)
                               .map(p => p.trim())
                               .filter(p => p.length > 0);

        if (paragraphs.length === 0) return null;

        // MULTI-SPEAKER LOGIC & RATE LIMIT PROTECTION
        // We now process sequentially instead of Promise.all to avoid hitting Gemini's RPM limit.
        
        const audioChunks: Uint8Array[] = [];

        for (let i = 0; i < paragraphs.length; i++) {
            // Check abort signal inside loop
            if (signal?.aborted) throw new Error('Aborted');

            const p = paragraphs[i];
            let currentText = p;
            let currentVoice = voice;
            let chunkSpeakers = speakers; 

            if (speakers) {
                const nameA = speakers.speakerA.name.trim();
                const nameB = speakers.speakerB.name.trim();
                const nameC = speakers.speakerC?.name.trim();
                const nameD = speakers.speakerD?.name.trim();
                
                // Regex to match "Name:" or "Name :" at start of string, case insensitive
                const regexA = new RegExp(`^${escapeRegExp(nameA)}\\s*:\\s*`, 'i');
                const regexB = new RegExp(`^${escapeRegExp(nameB)}\\s*:\\s*`, 'i');
                const regexC = nameC ? new RegExp(`^${escapeRegExp(nameC)}\\s*:\\s*`, 'i') : null;
                const regexD = nameD ? new RegExp(`^${escapeRegExp(nameD)}\\s*:\\s*`, 'i') : null;

                if (regexA.test(p)) {
                    currentVoice = speakers.speakerA.voice;
                    currentText = p.replace(regexA, '').trim(); 
                    chunkSpeakers = undefined; 
                } else if (regexB.test(p)) {
                    currentVoice = speakers.speakerB.voice;
                    currentText = p.replace(regexB, '').trim();
                    chunkSpeakers = undefined; 
                } else if (regexC && regexC.test(p) && speakers.speakerC) {
                    currentVoice = speakers.speakerC.voice;
                    currentText = p.replace(regexC, '').trim();
                    chunkSpeakers = undefined;
                } else if (regexD && regexD.test(p) && speakers.speakerD) {
                    currentVoice = speakers.speakerD.voice;
                    currentText = p.replace(regexD, '').trim();
                    chunkSpeakers = undefined;
                }
            }

            // Skip empty lines
            if (!currentText) continue;

            try {
                // Generate Audio Chunk
                const chunk = await generateAudioChunk(currentText, currentVoice, emotion, chunkSpeakers, signal, seed);
                if (chunk) audioChunks.push(chunk);

                // --- SAFETY DELAY ---
                // Add a small pause between API calls to prevent "Too Many Requests" (429) errors.
                // Especially important for long dialogues in demos.
                if (i < paragraphs.length - 1) {
                    await delay(800); // 0.8s wait + processing time ≈ safe RPM
                }

            } catch (err) {
                // If one chunk fails, rethrow to trigger the main error handler (which switches to Azure)
                throw err;
            }
        }

        // Gemini is strictly 24000Hz
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
