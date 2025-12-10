
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
 * INTELLIGENT VOICE MAPPING V6 (The "Kuwaiti Master" Strategy)
 * 
 * Correction based on User Feedback:
 * 1. Kuwaiti Engine is the "Gold Standard" for correct pronunciation (Tafkhim of Aleph).
 * 2. Jordan MAPS TO Kuwaiti, but gets HEAVILY modified (Slower/Deeper).
 * 3. Kuwaiti stays Kuwaiti (Native), with minimal modification to preserve its quality.
 * 4. Other Gulf dialects (Qatar, Bahrain) map to Kuwaiti to benefit from the correct Aleph.
 */
const QUALITY_MAPPING: Record<string, string> = {
    // --- JORDANIAN STRATEGY: DISGUISED KUWAITI ---
    // Use Kuwaiti engine (Fahed/Noura) as the base because pronunciation is correct.
    // We will slow it down in `getVoiceOptimizations` to sound Jordanian.
    'ar-JO-TaimNeural': 'ar-KW-FahedNeural',
    'ar-JO-SanaNeural': 'ar-KW-NouraNeural',
    
    // --- GULF CONSOLIDATION: THE KUWAITI STANDARD ---
    // User identified Kuwaiti as having the best "Tafkhim".
    // Map Qatar & Bahrain & Yemen to Kuwait.
    'ar-QA-AmalNeural': 'ar-KW-NouraNeural',
    'ar-QA-MoazNeural': 'ar-KW-FahedNeural',
    'ar-BH-AliNeural': 'ar-KW-FahedNeural',
    'ar-BH-LailaNeural': 'ar-KW-NouraNeural',
    'ar-YE-MaryamNeural': 'ar-KW-NouraNeural',
    'ar-YE-SalehNeural': 'ar-KW-FahedNeural',
    
    // Omani is good enough to keep as Omani (unless user requests otherwise later)
    // Saudi is distinct enough to keep as Saudi.
};

/**
 * Get the actual backend voice ID to use.
 */
function getBackendVoiceId(uiVoiceId: string): string {
    return QUALITY_MAPPING[uiVoiceId] || uiVoiceId;
}

/**
 * INTELLIGENT LOCALE MAPPING
 */
function getOptimizedLocale(voiceId: string): string {
    const actualVoiceId = getBackendVoiceId(voiceId);
    const parts = actualVoiceId.split('-');
    if (parts.length >= 2) {
        return `${parts[0]}-${parts[1]}`;
    }
    return 'ar-SA';
}

/**
 * VOICE OPTIMIZER (The "Physics" Engine)
 * Defines the acoustic profile for each dialect.
 */
interface VoiceSettings {
    pitch: string;
    rateOffset: number;
    forcedStyle?: string;
}

function getVoiceOptimizations(uiVoiceId: string): VoiceSettings {
    // 1. JORDANIAN PROFILE (The "Heavy Bedouin" Disguise)
    // Uses Kuwaiti engine, but we apply heavy brakes and depth.
    if (uiVoiceId.includes('ar-JO')) {
        return { 
            pitch: '-3%',  // Deepen significantly for "Hiba"
            rateOffset: -6, // Slow down to differentiate from the faster Kuwaiti original
            forcedStyle: '' // Neutral style creates the most serious tone
        };
    }

    // 2. KUWAITI PROFILE (The "Correct" Standard)
    // This is the reference. We keep it almost raw to preserve the "Heavy Aleph".
    // Just a tiny pitch drop (-1%) to ensure it doesn't sound thin (Tarqiq) due to AI variance.
    if (uiVoiceId.includes('ar-KW')) {
        return { 
            pitch: '-1%', // Just a touch of weight
            rateOffset: 0 // Natural speed (Don't slow it down like Jordan)
        };
    }

    // 3. LEBANESE PROFILE (The "Melodic" Fix)
    // Needs significant slowing and lifting.
    if (uiVoiceId.includes('ar-LB')) {
        return { 
            pitch: '+3%',  // Higher/Lighter
            rateOffset: -10, // Very slow/relaxed
            forcedStyle: 'empathetic' // Breathiness
        };
    }

    // 4. EGYPTIAN PROFILE (The "Clear" Fix)
    if (uiVoiceId.includes('ar-EG')) {
        return { 
            pitch: '-2%', 
            rateOffset: -4, 
            forcedStyle: 'cheerful' // Hides robotic artifacts
        };
    }

    // Default
    return { pitch: '0%', rateOffset: 0 };
}

/**
 * Calls the backend API to generate speech using Microsoft Azure AI Speech (Neural).
 */
export async function generateStandardSpeech(
    text: string,
    voiceId: string, // The ID selected in UI
    pauseDuration: number = 0, 
    emotion: string = 'Default' 
): Promise<Uint8Array | null> {
    try {
        // 1. RESOLVE ENGINE 
        const backendVoiceId = getBackendVoiceId(voiceId);
        const langCode = getOptimizedLocale(backendVoiceId);

        let payload: any = { voiceId: backendVoiceId };

        // 2. APPLY OPTIMIZATIONS (Based on the UI selection)
        // CRITICAL: We pass `voiceId` (User Selection) not `backendVoiceId` (Engine).
        // This ensures "Jordan" gets different settings than "Kuwait" even if they use the same engine.
        const settings = getVoiceOptimizations(voiceId);

        let azureStyle = settings.forcedStyle || '';
        let pitch = settings.pitch;
        
        // Base rate from optimization
        let baseRate = settings.rateOffset; 

        // 3. APPLY USER EMOTION (Overlays on top of optimization)
        switch (emotion) {
            case 'happy': 
                azureStyle = 'cheerful'; 
                baseRate += 5; 
                pitch = '+2%'; 
                break;
            case 'sad': 
                azureStyle = 'sad'; 
                baseRate -= 10; 
                pitch = '-5%'; 
                break;
            case 'formal': 
                azureStyle = 'newscast'; 
                break;
            case 'epic_poet': 
                azureStyle = 'empathetic'; 
                baseRate -= 12; 
                pitch = '-4%'; 
                break;
            case 'heritage_narrator':
                azureStyle = 'narration-professional'; 
                baseRate -= 5; 
                break;
            case 'news_anchor':
                azureStyle = 'newscast';
                baseRate += 5;
                break;
            case 'sports_commentator':
                azureStyle = 'shouting'; 
                baseRate += 15;
                pitch = '+5%';
                break;
            case 'thriller':
                azureStyle = 'whispering';
                baseRate -= 10;
                break;
        }

        const rate = `${baseRate}%`;

        const paragraphs = text.split(/\n\s*\n/);
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            let cleanPara = para.trim();
            if (cleanPara) {
                // --- POETRY RHYME HACK ---
                if (emotion === 'epic_poet') {
                    cleanPara = cleanPara.replace(/[.!?؟,،]+$/, '');
                    if (/[\u064F]$/.test(cleanPara)) cleanPara += 'و'; 
                    else if (/[\u0650]$/.test(cleanPara)) cleanPara += 'ي';
                    else if (/[\u064E]$/.test(cleanPara)) cleanPara += 'ا';
                }

                innerContent += escapeXml(cleanPara);
                if (index < paragraphs.length - 1 && pauseDuration > 0) {
                    innerContent += `<break time="${Math.round(pauseDuration * 1000)}ms"/>`;
                }
            }
        });

        // Apply Prosody
        if (rate !== '0%' || pitch !== '0%') {
            innerContent = `<prosody rate="${rate}" pitch="${pitch}">${innerContent}</prosody>`;
        }

        // Apply Style
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
    pauseDuration: number = 0.5 
): Promise<Uint8Array | null> {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return null;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const segments: { text: string, voice: string }[] = [];
    
    const nameA = speakers.speakerA.name.trim();
    const nameB = speakers.speakerB.name.trim();
    const nameC = speakers.speakerC?.name.trim();
    const nameD = speakers.speakerD?.name.trim();

    const regexA = new RegExp(`^${escapeRegExp(nameA)}\\s*:\\s*`, 'i');
    const regexB = new RegExp(`^${escapeRegExp(nameB)}\\s*:\\s*`, 'i');
    const regexC = nameC ? new RegExp(`^${escapeRegExp(nameC)}\\s*:\\s*`, 'i') : null;
    const regexD = nameD ? new RegExp(`^${escapeRegExp(nameD)}\\s*:\\s*`, 'i') : null;

    let currentVoice = defaultVoice; 

    for (const line of lines) {
        let lineText = line;
        let lineVoice = currentVoice; 

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
            currentVoice = lineVoice; 
        }
    }

    if (segments.length === 0) return null;

    const audioBuffers: AudioBuffer[] = [];
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const seg of segments) {
        try {
            // Mapping and Optimization handled inside generateStandardSpeech
            const mp3Bytes = await generateStandardSpeech(seg.text, seg.voice, 0);
            if (mp3Bytes) {
                const bufferCopy = mp3Bytes.slice(0).buffer;
                const audioBuffer = await ctx.decodeAudioData(bufferCopy);
                audioBuffers.push(audioBuffer);
            }
        } catch (e) {
            console.error(`Failed to generate segment for voice ${seg.voice}:`, e);
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
