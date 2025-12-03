
import { decode, createWavBlob } from '../utils/audioUtils';
import { SpeakerConfig } from '../types';

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
            if (errorData.details && errorData.details.includes('PERMISSION_DENIED') && errorData.details.includes('API has not been used')) {
                 const match = errorData.details.match(/project (\d+)/);
                 const usedProjectNum = match ? match[1] : 'UNKNOWN';
                 const configuredProject = errorData.projectId || 'UNKNOWN';
                 
                 throw new Error(`CRITICAL CONFIG ERROR: Your Private Key belongs to Project ID/Num '${usedProjectNum}', but you are trying to use Project '${configuredProject}'. Please go to Vercel and update FIREBASE_PRIVATE_KEY with the key from '${configuredProject}'.`);
            }

            if (errorData.details && (errorData.details.includes('DECODER routines') || errorData.details.includes('bad decrypt'))) {
                throw new Error("KEY FORMAT ERROR: The FIREBASE_PRIVATE_KEY in Vercel is malformed. Please remove any surrounding quotes (\") and ensure the key starts exactly with -----BEGIN PRIVATE KEY-----");
            }

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

/**
 * Generates multi-speaker audio by parsing text and stitching multiple Studio voice requests.
 */
export async function generateMultiSpeakerStandardSpeech(
    text: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    defaultVoice: string
): Promise<Uint8Array | null> {
    // 1. Parse text into segments
    // Regex to split by newlines, handling both \n and \r\n
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return null;

    // Helper for regex escaping
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const segments: { text: string, voice: string }[] = [];
    
    // Prepare regex for speakers
    const nameA = speakers.speakerA.name.trim();
    const nameB = speakers.speakerB.name.trim();
    const nameC = speakers.speakerC?.name.trim();
    const nameD = speakers.speakerD?.name.trim();

    const regexA = new RegExp(`^${escapeRegExp(nameA)}\\s*:\\s*`, 'i');
    const regexB = new RegExp(`^${escapeRegExp(nameB)}\\s*:\\s*`, 'i');
    const regexC = nameC ? new RegExp(`^${escapeRegExp(nameC)}\\s*:\\s*`, 'i') : null;
    const regexD = nameD ? new RegExp(`^${escapeRegExp(nameD)}\\s*:\\s*`, 'i') : null;

    let currentVoice = defaultVoice; // fallback

    for (const line of lines) {
        let lineText = line;
        let lineVoice = currentVoice; // Continue with previous voice by default unless name found

        if (regexA.test(line)) {
            lineVoice = speakers.speakerA.voice;
            lineText = line.replace(regexA, '').trim();
        } else if (regexB.test(line)) {
            lineVoice = speakers.speakerB.voice;
            lineText = line.replace(regexB, '').trim();
        } else if (regexC && regexC.test(line) && speakers.speakerC) {
            lineVoice = speakers.speakerC.voice;
            lineText = line.replace(regexC, '').trim();
        } else if (regexD && regexD.test(line) && speakers.speakerD) {
            lineVoice = speakers.speakerD.voice;
            lineText = line.replace(regexD, '').trim();
        }

        if (lineText.length > 0) {
            segments.push({ text: lineText, voice: lineVoice });
            currentVoice = lineVoice; // Update context for next lines
        }
    }

    if (segments.length === 0) return null;

    // 2. Fetch audio for all segments
    // We fetch linearly to maintain order and simplicity, though parallel is possible
    const audioBuffers: AudioBuffer[] = [];
    
    // We need an AudioContext to decode MP3 data coming from Google
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const seg of segments) {
        try {
            const mp3Bytes = await generateStandardSpeech(seg.text, seg.voice);
            if (mp3Bytes) {
                // Decode MP3 bytes to AudioBuffer
                // We must clone buffer because decodeAudioData detaches it
                const bufferCopy = mp3Bytes.slice(0).buffer;
                const audioBuffer = await ctx.decodeAudioData(bufferCopy);
                audioBuffers.push(audioBuffer);
            }
        } catch (e) {
            console.error(`Failed to generate segment for voice ${seg.voice}:`, e);
            // Skip failed segment or insert silence? Skip for now.
        }
    }

    if (audioBuffers.length === 0) return null;

    // 3. Stitch AudioBuffers
    // Calculate total length
    // Add small silence (0.2s) between segments for natural flow
    const PAUSE_DURATION = 0.2; 
    const PAUSE_SAMPLES = Math.floor(PAUSE_DURATION * ctx.sampleRate);
    
    let totalLength = 0;
    audioBuffers.forEach((buf, i) => {
        totalLength += buf.length;
        if (i < audioBuffers.length - 1) totalLength += PAUSE_SAMPLES;
    });

    const outputBuffer = ctx.createBuffer(1, totalLength, ctx.sampleRate); // Mono for now
    const outputData = outputBuffer.getChannelData(0);
    
    let offset = 0;
    for (let i = 0; i < audioBuffers.length; i++) {
        const buf = audioBuffers[i];
        // Mix down to mono if source is stereo
        const inputData = buf.getChannelData(0); 
        outputData.set(inputData, offset);
        offset += buf.length;
        
        // Add silence
        if (i < audioBuffers.length - 1) {
            offset += PAUSE_SAMPLES; // Leave 0s (silence)
        }
    }

    // 4. Convert merged AudioBuffer back to WAV Blob/Bytes to return to App
    // We reuse createWavBlob logic
    const wavBlob = createWavBlob(outputBuffer, 1, ctx.sampleRate);
    const wavArrayBuffer = await wavBlob.arrayBuffer();
    
    return new Uint8Array(wavArrayBuffer);
}
