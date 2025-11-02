import type { SpeakerConfig } from '../App';

export type SpeechSpeed = number;

interface TranslationResult {
    translatedText: string;
    speakerMapping: Record<string, string>;
}

export async function translateText(
    text: string, 
    sourceLang: string, 
    targetLang: string, 
    speakerAName: string, 
    speakerBName: string, 
    signal: AbortSignal
): Promise<TranslationResult> {
    if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sourceLang, targetLang }),
            signal: signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const result: TranslationResult = await response.json();
        return result;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Translation failed: ${errorMessage}`);
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
    signal: AbortSignal
): Promise<Uint8Array | null> {
    if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice, speed, languageName, pauseDuration, emotion, speakers }),
            signal: signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        const audioData = await response.arrayBuffer();
        if (audioData.byteLength === 0) return null;
        return new Uint8Array(audioData);

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Speech generation failed: ${errorMessage}`);
    }
}

export async function previewVoice(voice: string, sampleText: string, signal: AbortSignal): Promise<Uint8Array | null> {
    // This function can remain simple, as the backend handles the default values.
    return generateSpeech(sampleText, voice, 1.0, 'English', 0, 'Default', undefined, signal);
}
