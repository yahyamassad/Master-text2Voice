
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
            
            // Check for Project ID mismatch specifically
            // Google error format: "Cloud Text-to-Speech API has not been used in project 12345..."
            if (errorData.details && errorData.details.includes('PERMISSION_DENIED') && errorData.details.includes('API has not been used')) {
                 const match = errorData.details.match(/project (\d+)/);
                 const usedProjectNum = match ? match[1] : 'UNKNOWN';
                 const configuredProject = errorData.projectId || 'UNKNOWN';
                 
                 throw new Error(`CRITICAL CONFIG ERROR: Your Private Key belongs to Project ID/Num '${usedProjectNum}', but you are trying to use Project '${configuredProject}'. Please go to Vercel and update FIREBASE_PRIVATE_KEY with the key from '${configuredProject}'.`);
            }

            // Check for Decoder/Key format errors
            if (errorData.details && (errorData.details.includes('DECODER routines') || errorData.details.includes('bad decrypt'))) {
                throw new Error("KEY FORMAT ERROR: The FIREBASE_PRIVATE_KEY in Vercel is malformed. Please remove any surrounding quotes (\") and ensure the key starts exactly with -----BEGIN PRIVATE KEY-----");
            }

            // Surface the specific 'details' from the backend if available
            const errorMessage = errorData.details 
                ? `${errorData.error}: ${errorData.details}` 
                : (errorData.error || `Studio voice error: ${response.status}`);
            
            throw new Error(errorMessage);
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
