import { decode } from '../utils/audioUtils';

export type SpeechSpeed = number;
export interface SpeakerConfig {
    name: string;
    voice: string;
}

interface TranslationResult {
    translatedText: string;
    speakerMapping: Record<string, string>;
}

// This function now calls our own backend API endpoint instead of Gemini directly.
export async function translateText(text: string, sourceLang: string, targetLang: string, speakerAName: string, speakerBName: string, signal: AbortSignal): Promise<TranslationResult> {
    const response = await fetch('/api/translate', {
        method: 'POST',
        signal: signal,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
            speakerAName,
            speakerBName
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Translation request failed' }));
        console.error('Error from /api/translate:', errorBody);
        throw new Error(errorBody.message || "API_ERROR");
    }

    const result = await response.json();
    
    // Convert array from API back to the record format expected by the app
    const speakerMappingRecord: Record<string, string> = {};
    if (result.speakerMapping) {
        for (const mapping of result.speakerMapping) {
            speakerMappingRecord[mapping.original] = mapping.translated;
        }
    }
    
    return {
        translatedText: result.translatedText,
        speakerMapping: speakerMappingRecord
    };
}

// A unified function for fetching speech from our backend endpoint.
async function fetchSpeech(
    text: string,
    voice: string,
    speed: SpeechSpeed,
    emotion: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig } | undefined,
    isPreview: boolean,
    signal: AbortSignal
): Promise<Uint8Array | null> {
    if (signal.aborted) {
        throw new Error('AbortError');
    }

    const response = await fetch('/api/speak', {
        method: 'POST',
        signal: signal,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
            voice,
            speed,
            emotion,
            speakers,
            isPreview,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Speech generation request failed' }));
        console.error('Error from /api/speak:', errorBody);
        throw new Error(errorBody.message || 'Failed to generate audio content from API');
    }

    const data = await response.json();
    const base64Audio = data.audioContent;

    if (base64Audio) {
        // Decode the base64 string received from our backend into a Uint8Array for the audio player.
        return decode(base64Audio);
    }

    console.error('Failed to get audio content from the backend response.');
    return null;
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
    return fetchSpeech(text, voice, speed, emotion, speakers, false, signal);
}

export async function previewVoice(voice: string, sampleText: string, signal: AbortSignal): Promise<Uint8Array | null> {
    // For previews, we pass default values for speed/emotion and no speakers.
    return fetchSpeech(sampleText, voice, 1.0, 'Default', undefined, true, signal);
}
