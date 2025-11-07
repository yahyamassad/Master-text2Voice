import { SpeakerConfig } from '../types';
import { decode } from '../utils/audioUtils';

// A helper for API requests with consistent error handling and auth headers.
async function postApiRequest(endpoint: string, body: any, signal?: AbortSignal, idToken?: string): Promise<any> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
    }

    // Pass the developer secret key if it's available in the session
    const ownerSecretKey = sessionStorage.getItem('owner_secret_key');
    if (ownerSecretKey) {
        headers['x-owner-secret-key'] = ownerSecretKey;
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal,
    });

    if (!response.ok) {
        let errorData;
        try {
            // Try to parse a JSON error response from the backend
            errorData = await response.json();
        } catch (e) {
            // If the response isn't JSON, use the HTTP status text
            throw new Error(response.statusText || `Request failed with status ${response.status}`);
        }
        // Throw an error with the specific message from the API
        throw new Error(errorData.error || 'An unknown server error occurred');
    }

    return response.json();
}

/**
 * Calls the backend API to generate speech from text.
 * @returns A Promise that resolves with the raw PCM audio data as a Uint8Array.
 */
export async function generateSpeech(
    text: string,
    voice: string,
    emotion: string,
    pauseDuration: number,
    speakers?: { speakerA: SpeakerConfig, speakerB: SpeakerConfig },
    signal?: AbortSignal,
    idToken?: string,
): Promise<Uint8Array | null> {
    
    // The new backend only needs these parameters for SSML-based generation.
    const body = {
        text,
        voice,
        emotion,
        pauseDuration,
        speakers
    };
    
    try {
        const data = await postApiRequest('/api/speak', body, signal, idToken);
        if (data.audioContent) {
            // The audio content is base64 encoded; decode it to raw bytes for playback.
            return decode(data.audioContent);
        }
        return null;
    } catch (error) {
        console.error("Gemini Service (generateSpeech) failed:", error);
        throw error; // Re-throw the error to be handled by the UI component
    }
}

/**
 * Calls the backend API to translate text.
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
     const body = {
        text,
        sourceLang,
        targetLang,
        speakerAName,
        speakerBName
    };
    try {
        const data = await postApiRequest('/api/translate', body, signal, idToken);
        return data;
    } catch (error) {
        console.error("Gemini Service (translateText) failed:", error);
        throw error;
    }
}

/**
 * Calls the backend API to generate a short voice preview.
 * This uses the same endpoint as generateSpeech but with predefined, simple parameters.
 * @returns A Promise that resolves with the raw PCM audio data as a Uint8Array.
 */
export async function previewVoice(
    voiceId: string,
    previewText: string,
    emotion: string,
    signal?: AbortSignal
): Promise<Uint8Array | null> {
    const body = {
        text: previewText,
        voice: voiceId,
        emotion: emotion,
        pauseDuration: 0,
    };

    try {
        const data = await postApiRequest('/api/speak', body, signal);
        if (data.audioContent) {
            return decode(data.audioContent);
        }
        return null;
    } catch (error) {
        console.error("Gemini Service (previewVoice) failed:", error);
        throw error;
    }
}