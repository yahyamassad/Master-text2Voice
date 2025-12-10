
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
 * INTELLIGENT VOICE MAPPING V3 (The "Rule Breaker" Strategy)
 * Goal: Maximize "Tafkhim" (Phonetic Weight) and Correct Dialect Identity.
 * 
 * Logic based on User Feedback:
 * 1. Egypt: Native engine is weak/thin. Syrian is too light. 
 *    -> Map to SAUDI (Zariyah/Hamed) for a heavier, "News Anchor" Fusha style.
 * 2. Jordan: Native engine sounds Syrian. Jordan is acoustically closer to Gulf/Bedouin.
 *    -> Map to UAE (Fatima/Hamdan) for better weight and distinctness from Syria.
 * 3. Gulf: Omani engine is the "Gold Standard" for Tafkhim.
 *    -> Map Qatari, Bahraini, Kuwaiti to OMANI (Aysha/Abdullah).
 */
const QUALITY_MAPPING: Record<string, string> = {
    // --- EGYPTIAN STRATEGY: HEAVY FUSHA ---
    // Map to Saudi to get the "Weight" (Tafkhim) missing in the native engine.
    'ar-EG-SalmaNeural': 'ar-SA-ZariyahNeural', 
    'ar-EG-ShakirNeural': 'ar-SA-HamedNeural',

    // --- JORDANIAN STRATEGY: BEDOUIN/GULF PROXIMITY ---
    // Map to UAE instead of Syria. UAE engine has better authority and closer intonation.
    'ar-JO-TaimNeural': 'ar-AE-HamdanNeural',
    'ar-JO-SanaNeural': 'ar-AE-FatimaNeural',
    
    // --- LEBANESE STRATEGY: LEVANTINE PURITY ---
    // Keep with Syrian (Amany/Laith) as it's the closest accurate dialect.
    'ar-LB-LaylaNeural': 'ar-SY-AmanyNeural',
    'ar-LB-RamiNeural': 'ar-SY-LaithNeural',

    // --- GULF CONSOLIDATION: THE OMANI STANDARD ---
    // User rated Omani as "Very Good" for Tafkhim. Use it everywhere in Gulf.
    // Qatar
    'ar-QA-AmalNeural': 'ar-OM-AyshaNeural',
    'ar-QA-MoazNeural': 'ar-OM-AbdullahNeural',
    // Bahrain
    'ar-BH-AliNeural': 'ar-OM-AbdullahNeural',
    'ar-BH-LailaNeural': 'ar-OM-AyshaNeural',
    // Kuwait
    'ar-KW-FahedNeural': 'ar-OM-AbdullahNeural',
    'ar-KW-NouraNeural': 'ar-OM-AyshaNeural',
    
    // Saudi & UAE & Omani & Syrian natives are kept as is (The "Good" list).
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
 * TAFKHIM BOOSTER (The "Weight" Algorithm)
 * Adjusts Pitch and Speed slightly to create a fuller, deeper sound 
 * for voices that tend to be "thin" (Tarqiq).
 */
function getTafkhimSettings(uiVoiceId: string): { pitch: string, rateOffset: number } {
    // Egyptian mapped to Saudi: Lower pitch slightly to differentiate from pure Saudi
    if (uiVoiceId.includes('ar-EG')) return { pitch: '-2%', rateOffset: -2 };
    
    // Jordanian mapped to UAE: Slightly slower for gravitas
    if (uiVoiceId.includes('ar-JO')) return { pitch: '-1%', rateOffset: -3 };

    // Default: No adjustment
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
        // 1. SWAP THE VOICE ENGINE
        const backendVoiceId = getBackendVoiceId(voiceId);
        
        // 2. SET LOCALE
        const langCode = getOptimizedLocale(backendVoiceId);

        let payload: any = { voiceId: backendVoiceId };

        // 3. APPLY TAFKHIM (Weight) SETTINGS
        const tafkhim = getTafkhimSettings(voiceId);

        let azureStyle = '';
        let rate = '0%';
        let pitch = tafkhim.pitch; // Base pitch from Tafkhim

        // Global Rate Tweak + Tafkhim Offset
        // Default slowing (-2%) + specific offset
        let baseRate = -2 + tafkhim.rateOffset; 

        // Style Mapping Logic (Emotions override default pitch if needed, but we try to combine)
        switch (emotion) {
            case 'happy': 
                azureStyle = 'cheerful'; 
                baseRate += 5; // Happy is faster
                pitch = '+2%'; // Lighter
                break;
            case 'sad': 
                azureStyle = 'sad'; 
                baseRate -= 10; 
                pitch = '-5%'; // Deep sadness
                break;
            case 'formal': 
                azureStyle = 'newscast'; 
                // Keep Tafkhim pitch for formal
                break;
            
            case 'epic_poet': 
                azureStyle = 'empathetic'; 
                baseRate -= 12; 
                pitch = '-4%'; // Very deep for poetry
                break;
            case 'heritage_narrator':
                azureStyle = 'narration-professional'; 
                baseRate -= 5; 
                pitch = '-3%'; 
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
            default: 
                // For default, we stick to the Tafkhim pitch calculated above
                azureStyle = '';
        }

        rate = `${baseRate}%`;

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

        // Apply Prosody (Rate & Pitch)
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
            // Mapping and Tafkhim handled inside generateStandardSpeech
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
