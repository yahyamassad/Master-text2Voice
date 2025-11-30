import { decode } from '../utils/audioUtils';

/**
 * Calls the backend API to generate speech using AWS Polly Standard engine.
 * This is the robust alternative to browser SpeechSynthesis.
 */
export async function generateStandardSpeech(
    text: string,
    voiceId: string, // e.g., 'Zeina', 'Joanna'
    languageCode?: string // optional
): Promise<Uint8Array | null> {
    try {
        const response = await fetch('/api/speak-standard', {
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
            throw new Error(errorData.error || `Standard voice error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
            console.warn("Standard API returned no audio content.");
            return null;
        }
        
        return decode(data.audioContent);

    } catch (error) {
        console.error("Standard Speech Generation Failed:", error);
        throw error;
    }
}