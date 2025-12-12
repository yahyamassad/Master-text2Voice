
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
 * VOICE MAPPING (STABLE)
 */
const QUALITY_MAPPING: Record<string, string> = {
    'ar-JO-TaimNeural': 'ar-KW-FahedNeural',
    'ar-JO-SanaNeural': 'ar-KW-NouraNeural',
    'ar-QA-AmalNeural': 'ar-KW-NouraNeural',
    'ar-QA-MoazNeural': 'ar-KW-FahedNeural',
    'ar-BH-AliNeural': 'ar-KW-FahedNeural',
    'ar-BH-LailaNeural': 'ar-KW-NouraNeural',
    'ar-YE-MaryamNeural': 'ar-KW-NouraNeural',
    'ar-YE-SalehNeural': 'ar-KW-FahedNeural',
};

function getBackendVoiceId(uiVoiceId: string): string {
    return QUALITY_MAPPING[uiVoiceId] || uiVoiceId;
}

function getOptimizedLocale(voiceId: string): string {
    const actualVoiceId = getBackendVoiceId(voiceId);
    const parts = actualVoiceId.split('-');
    if (parts.length >= 2) {
        return `${parts[0]}-${parts[1]}`;
    }
    return 'ar-SA';
}

/**
 * Detects if text is predominantly English/Latin.
 */
function isTextEnglish(text: string): boolean {
    const latinMatch = text.match(/[a-zA-Z]/g);
    const arabicMatch = text.match(/[\u0600-\u06FF]/g);
    const latinCount = latinMatch ? latinMatch.length : 0;
    const arabicCount = arabicMatch ? arabicMatch.length : 0;
    return latinCount > arabicCount && latinCount > 3;
}

/**
 * Calls the backend API to generate speech.
 */
export async function generateStandardSpeech(
    text: string,
    voiceId: string, 
    pauseDuration: number = 0, 
    emotion: string = 'Default' 
): Promise<Uint8Array | null> {
    try {
        let backendVoiceId = getBackendVoiceId(voiceId);
        
        // --- LANGUAGE GUARD ---
        if (backendVoiceId.startsWith('ar-') && isTextEnglish(text)) {
            backendVoiceId = 'en-US-AndrewNeural'; 
        } else if (backendVoiceId.startsWith('en-') && !isTextEnglish(text) && text.trim().length > 0) {
             const arabicMatch = text.match(/[\u0600-\u06FF]/g);
             if (arabicMatch && arabicMatch.length > 5) {
                 backendVoiceId = 'ar-SA-HamedNeural';
             }
        }

        const langCode = getOptimizedLocale(backendVoiceId);
        let payload: any = { voiceId: backendVoiceId };

        let azureStyle = '';
        let pitch = '0%';
        let baseRate = 0;

        switch (emotion) {
            case 'happy': azureStyle = 'cheerful'; baseRate += 5; pitch = '+2%'; break;
            case 'sad': azureStyle = 'sad'; baseRate -= 10; pitch = '-5%'; break;
            case 'formal': azureStyle = 'newscast'; break;
            case 'epic_poet': azureStyle = 'empathetic'; baseRate -= 10; break;
            case 'heritage_narrator': azureStyle = 'narration-professional'; break;
            case 'news_anchor': azureStyle = 'newscast'; break;
            case 'sports_commentator': azureStyle = 'shouting'; baseRate += 10; break;
            case 'thriller': azureStyle = 'whispering'; break;
        }

        const rate = `${baseRate}%`;
        const paragraphs = text.split(/\n\s*\n/);
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            let cleanPara = para.trim();
            if (cleanPara) {
                innerContent += escapeXml(cleanPara);
                if (index < paragraphs.length - 1 && pauseDuration > 0) {
                    innerContent += `<break time="${Math.round(pauseDuration * 1000)}ms"/>`;
                }
            }
        });

        if (rate !== '0%' || pitch !== '0%') {
            innerContent = `<prosody rate="${rate}" pitch="${pitch}">${innerContent}</prosody>`;
        }

        if (azureStyle) {
            innerContent = `<mstts:express-as style="${azureStyle}">${innerContent}</mstts:express-as>`;
        }
        
        const fullSSML = `
            <speak version='1.0' xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang='${langCode}'>
                <voice xml:lang='${langCode}' xml:gender='Female' name='${backendVoiceId}'>
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
            throw new Error(`Azure error: ${response.status}`);
        }

        const data = await response.json();
        return data.audioContent ? decode(data.audioContent) : null;

    } catch (error) {
        console.error("Azure Speech Failed:", error);
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
    pauseDuration: number = 0.5 
): Promise<Uint8Array | null> {
    // CRITICAL: Split by ANY newline character to handle single or double breaks
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const segments: { text: string, voice: string }[] = [];
    
    const nameA = speakers.speakerA.name.trim();
    const nameB = speakers.speakerB.name.trim();
    const nameC = speakers.speakerC?.name.trim();
    const nameD = speakers.speakerD?.name.trim();

    // IMPROVED REGEX: Matches "Name:", "Name :", "Name-", or "Name " at start of line
    // Also allows for optional Markdown bolding like **Name**:
    const createRegex = (name: string) => {
        const escaped = escapeRegExp(name);
        return new RegExp(`^(\\*\\*)?${escaped}(\\*\\*)?\\s*[:\\-]?\\s*`, 'i');
    };

    const regexA = createRegex(nameA);
    const regexB = createRegex(nameB);
    const regexC = nameC ? createRegex(nameC) : null;
    const regexD = nameD ? createRegex(nameD) : null;

    let currentVoice = defaultVoice; 

    for (const line of lines) {
        let lineText = line;
        let lineVoice = currentVoice; 
        let matched = false;

        if (regexA.test(line)) {
            lineVoice = speakers.speakerA.voice;
            lineText = line.replace(regexA, '').trim(); 
            matched = true;
        } else if (regexB.test(line)) {
            lineVoice = speakers.speakerB.voice;
            lineText = line.replace(regexB, '').trim(); 
            matched = true;
        } else if (regexC && regexC.test(line) && speakers.speakerC) {
            lineVoice = speakers.speakerC.voice;
            lineText = line.replace(regexC, '').trim(); 
            matched = true;
        } else if (regexD && regexD.test(line) && speakers.speakerD) {
            lineVoice = speakers.speakerD.voice;
            lineText = line.replace(regexD, '').trim(); 
            matched = true;
        }

        if (matched) {
            currentVoice = lineVoice; 
        }

        // Only add if there is text left after stripping the name
        if (lineText.length > 0) {
            segments.push({ text: lineText, voice: lineVoice });
        }
    }

    if (segments.length === 0) return null;

    const audioBuffers: AudioBuffer[] = [];
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const seg of segments) {
        try {
            const mp3Bytes = await generateStandardSpeech(seg.text, seg.voice, 0);
            if (mp3Bytes) {
                const bufferCopy = mp3Bytes.slice(0).buffer;
                const audioBuffer = await ctx.decodeAudioData(bufferCopy);
                audioBuffers.push(audioBuffer);
            }
        } catch (e) {
            console.error(`Failed to generate segment:`, e);
        }
    }

    if (audioBuffers.length === 0) return null;

    const PAUSE_SAMPLES = Math.floor(pauseDuration * ctx.sampleRate);
    
    let totalLength = 0;
    audioBuffers.forEach((buf, i) => {
        totalLength += buf.length;
        if (i < audioBuffers.length - 1) totalLength += PAUSE_SAMPLES;
    });

    const outputBuffer = ctx.createBuffer(1, totalLength, ctx.sampleRate); 
    const outputData = outputBuffer.getChannelData(0);
    
    let offset = 0;
    for (let i = 0; i < audioBuffers.length; i++) {
        const buf = audioBuffers[i];
        const inputData = buf.getChannelData(0); 
        outputData.set(inputData, offset);
        offset += buf.length;
        
        if (i < audioBuffers.length - 1) {
            offset += PAUSE_SAMPLES; 
        }
    }

    const wavBlob = createWavBlob(outputBuffer, 1, ctx.sampleRate);
    const wavArrayBuffer = await wavBlob.arrayBuffer();
    
    return new Uint8Array(wavArrayBuffer);
}
