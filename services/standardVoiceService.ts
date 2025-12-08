
import { decode, createWavBlob } from '../utils/audioUtils';
import { SpeakerConfig } from '../types';

/**
 * Helper to escape XML characters for SSML.
 */
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

/**
 * Calls the backend API to generate speech using Microsoft Azure AI Speech (Neural).
 */
export async function generateStandardSpeech(
    text: string,
    voiceId: string, // e.g., 'ar-EG-SalmaNeural'
    pauseDuration: number = 0, // Seconds
    emotion: string = 'Default' // Style mapping
): Promise<Uint8Array | null> {
    try {
        let payload: any = { voiceId };

        // Derive lang from voiceId (e.g. ar-EG-SalmaNeural -> ar-EG)
        const parts = voiceId.split('-');
        const langCode = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'en-US';

        // Map UI Emotion to Azure Style & Prosody
        let azureStyle = '';
        let rate = '0%';
        let pitch = '0%';

        // Style Mapping Logic
        switch (emotion) {
            // Standard Emotions
            case 'happy': azureStyle = 'cheerful'; break;
            case 'sad': azureStyle = 'sad'; rate = '-5%'; break;
            case 'formal': azureStyle = 'newscast'; break;
            
            // New Personas - Mapping to SSML Logic
            case 'epic_poet': 
                // CRITICAL FOR POETRY:
                // We use 'empathetic' as it flows better than standard reading.
                // Rate -15% gives time for the listener to process the weight of words.
                // Pitch +5% adds a "recitation" quality, making it sound less like reading news.
                // This combination helps "carry" the vowel at the end of lines better than default speed.
                azureStyle = 'empathetic'; 
                rate = '-15%'; 
                pitch = '+5%'; 
                break;
            case 'heritage_narrator':
                azureStyle = 'narration-professional'; 
                rate = '-10%'; // Slower for storytelling
                pitch = '-2%'; // Slightly deeper for authority
                break;
            case 'news_anchor':
                azureStyle = 'newscast';
                rate = '+5%';
                break;
            case 'sports_commentator':
                azureStyle = 'shouting'; // or excited
                rate = '+15%';
                pitch = '+5%';
                break;
            case 'thriller':
                azureStyle = 'whispering';
                rate = '-10%';
                break;
            
            // Legacy/Default
            default: azureStyle = '';
        }

        // Logic: Build SSML to handle Pauses AND Emotions
        // We always use SSML now to support these features
        
        const paragraphs = text.split(/\n\s*\n/);
        
        // Build Inner Text (Breaks logic)
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            const cleanPara = para.trim();
            if (cleanPara) {
                innerContent += escapeXml(cleanPara);
                if (index < paragraphs.length - 1 && pauseDuration > 0) {
                    innerContent += `<break time="${Math.round(pauseDuration * 1000)}ms"/>`;
                }
            }
        });

        // Wrap in Prosody (Rate/Pitch)
        if (rate !== '0%' || pitch !== '0%') {
            innerContent = `<prosody rate="${rate}" pitch="${pitch}">${innerContent}</prosody>`;
        }

        // Wrap in Style if selected
        if (azureStyle) {
            // Note: Not all voices support all styles. Azure ignores invalid styles gracefully usually,
            // but for robust support we blindly apply it.
            innerContent = `<mstts:express-as style="${azureStyle}">${innerContent}</mstts:express-as>`;
        }
        
        // Construct the final full SSML
        // Note: added xmlns:mstts for style support
        const fullSSML = `
            <speak version='1.0' xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang='${langCode}'>
                <voice xml:lang='${langCode}' xml:gender='Female' name='${voiceId}'>
                    ${innerContent}
                </voice>
            </speak>
        `;
        payload.ssml = fullSSML;

        const response = await fetch('/api/speak-azure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.details 
                ? `${errorData.error}: ${errorData.details}` 
                : (errorData.error || `Azure voice error: ${response.status}`);
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.audioContent) {
            console.warn("Azure API returned no audio content.");
            return null;
        }
        
        return decode(data.audioContent);

    } catch (error) {
        console.error("Azure Speech Generation Failed:", error);
        throw error;
    }
}

/**
 * Generates multi-speaker audio by parsing text and stitching multiple Azure voice requests.
 */
export async function generateMultiSpeakerStandardSpeech(
    text: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    defaultVoice: string,
    pauseDuration: number = 0.5 // Default pause between speaker turns
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
    
    // We need an AudioContext to decode MP3 data coming from Azure
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const seg of segments) {
        try {
            // We use simple generation here (no emotion/pause per line) 
            // Note: We could pass the global 'emotion' here if we updated this function signature too, 
            // but sticking to base functionality for multi-speaker standard for now to keep it robust.
            const mp3Bytes = await generateStandardSpeech(seg.text, seg.voice, 0);
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
    // Add dynamic silence between segments based on pauseDuration setting
    const PAUSE_SAMPLES = Math.floor(pauseDuration * ctx.sampleRate);
    
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
            // No data set = silence (0)
            offset += PAUSE_SAMPLES; 
        }
    }

    // 4. Convert merged AudioBuffer back to WAV Blob/Bytes to return to App
    // We reuse createWavBlob logic
    const wavBlob = createWavBlob(outputBuffer, 1, ctx.sampleRate);
    const wavArrayBuffer = await wavBlob.arrayBuffer();
    
    return new Uint8Array(wavArrayBuffer);
}
