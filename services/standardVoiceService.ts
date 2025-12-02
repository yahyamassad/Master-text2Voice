
import { decode } from '../utils/audioUtils';

/**
 * Calls the backend API to generate speech using Google Cloud TTS (WaveNet/Standard).
 * High reliability, industry standard quality.
 */
export async function generateStandardSpeech(
    text: string,
    voiceId: string, // e.g., 'ar-XA-Wavenet-A'
    languageCode?: string // optional, e.g., 'ar-XA'
): Promise<Uint8Array | null> {
    try {
        const response = await fetch('/api/speak-google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                voiceId: voiceId,
                languageCode: languageCode
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Studio voice error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
            console.warn("Studio API returned no audio content.");
            return null;
        }
        
        return decode(data.audioContent);

    } catch (error) {
        console.error("Studio Speech Generation Failed:", error);
        throw error;
    }
}
