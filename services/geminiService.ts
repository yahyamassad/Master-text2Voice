
import { SpeakerConfig, ARABIC_DIALECTS } from '../types';
import { decode } from '../utils/audioUtils';
import { getVoiceStyle } from '../utils/voiceStyles';

/**
 * Helper function to call the backend TTS API for a single chunk of text.
 */
async function generateAudioChunk(
    text: string,
    voice: string,
    emotion: string,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    signal?: AbortSignal,
    seed?: number,
    dialectId?: string
): Promise<Uint8Array | null> {
    
    let instructions: string[] = [];

    // 1. Add Dialect Instruction (Only for Arabic)
    if (dialectId) {
        const dialect = ARABIC_DIALECTS.find(d => d.id === dialectId);
        if (dialect) instructions.push(dialect.instruction);
    }
    
    // 2. Add Style/Persona Instruction
    if (emotion && emotion !== 'Default') {
        const style = getVoiceStyle(emotion);
        if (style) instructions.push(style.prompt);
        else instructions.push(`Emotion: ${emotion}`);
    }

    const promptText = instructions.length > 0 
        ? `[Instructions: ${instructions.join(' ')}] ${text}`
        : text;

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
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        return data.audioContent ? decode(data.audioContent) : null;

    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Aborted');
        console.error("Gemini Audio Chunk Error:", e);
        throw e;
    }
}

/**
 * Main function to generate multi-chunk speech.
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
    seed?: number,
    dialectId?: string
): Promise<Uint8Array | null> {
    // Split text into paragraphs to handle large inputs and pauses
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length === 0) return null;

    const chunks: (Uint8Array | null)[] = [];

    for (const p of paragraphs) {
        const chunk = await generateAudioChunk(p, voice, emotion, speakers, signal, seed, dialectId);
        chunks.push(chunk);
    }

    const validChunks = chunks.filter(c => c !== null) as Uint8Array[];
    if (validChunks.length === 0) return null;

    // For simple concatenation, this works for PCM/MP3 depending on backend response.
    // Ideally, use Web Audio API to merge properly.
    const totalLength = validChunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of validChunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
    }

    return combined;
}
