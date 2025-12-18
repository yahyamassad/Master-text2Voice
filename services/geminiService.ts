
import { SpeakerConfig, GEMINI_VOICES } from '../types';
import { decode } from '../utils/audioUtils';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateAudioChunk(text: string, voice: string, signal?: AbortSignal): Promise<Uint8Array | null> {
    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice }),
            signal
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Server Busy");
        }

        const data = await response.json();
        return data.audioContent ? decode(data.audioContent) : null;
    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Aborted');
        throw e;
    }
}

// Updated signature to fix TypeScript errors in App.tsx calls
export async function generateSpeech(
    text: string,
    voice: string,
    emotion: string,
    pauseDuration: number,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    signal?: AbortSignal,
    idToken?: string,
    speed?: number,
    seed?: number
): Promise<Uint8Array | null> {
    
    // Split text into chunks of roughly 800 characters to stay in the "Fast Lane"
    const chunks = text.match(/[^.!?\s][^.!?\n]{1,800}(?=[.!?\n]|$|[.!?\s])/g) || [text];
    const audioChunks: Uint8Array[] = [];

    for (const chunk of chunks) {
        if (signal?.aborted) throw new Error('Aborted');
        
        const pcm = await generateAudioChunk(chunk, voice, signal);
        if (pcm) audioChunks.push(pcm);
        
        // Brief rest to prevent hitting rate limits too fast
        await delay(500); 
    }

    if (audioChunks.length === 0) return null;

    // Merge audio chunks
    const totalSize = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of audioChunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

// Updated signature to fix TypeScript errors in App.tsx calls
export async function translateText(
    text: string, 
    sourceLang: string, 
    targetLang: string, 
    speakerAName?: string, 
    speakerBName?: string, 
    signal?: AbortSignal, 
    idToken?: string
): Promise<any> {
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ text, sourceLang, targetLang, speakerAName, speakerBName }),
        signal
    });
    return response.json();
}

export async function addDiacritics(text: string): Promise<string> {
    const response = await fetch('/api/enhance-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type: 'tashkeel' })
    });
    const data = await response.json();
    return data.enhancedText;
}

// Updated signature to fix TypeScript errors in SettingsModal.tsx calls
export async function previewVoice(voice: string, text: string, emotion?: string): Promise<Uint8Array | null> {
    return generateAudioChunk(text, voice);
}
