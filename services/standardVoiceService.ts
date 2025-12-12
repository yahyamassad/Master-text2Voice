
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
 * Stabilizes Arabic Text for TTS Engines (Azure/Gemini).
 * 1. Forces "Pausal Form" (Sukoon) on words ending in consonants to prevent unwanted MSA grammar endings (e.g., Yazan-u).
 * 2. Normalizes final Alif Maqsura (ى) to Alif (ا) in long words to prevent "swallowing" of the final sound.
 */
function stabilizeArabicText(text: string): string {
    // 1. Force Sukoon on words ending in consonants.
    // Targeted Consonants: Ba, Ta, Tha, Jim, Hha, Kha, Dal, Thal, Ra, Zain, Seen, Sheen, Sad, Dad, Tah, Zah, Ain, Ghain, Fa, Qaf, Kaf, Lam, Meem, Noon, Ha
    // Excludes: Alif, Waw, Ya, Ta-Marbuta, Hamza forms (to avoid breaking grammar basics)
    // Regex: Match specific chars at end of word (followed by space, punctuation, or EOL)
    let processed = text.replace(/([ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه])(?=\s|[.,!؟:;]|$)/g, '$1\u0652');

    // 2. Fix "Swallowed Endings" for Alif Maqsura (ى).
    // In many dialects, Azure reads final 'ى' too quickly or as a short vowel if not diacritized.
    // For words longer than 3 letters (to skip prepositions like على, إلى), we map 'ى' to 'ا' to force a long 'AA' sound.
    // Example: "بنتعشى" -> "بنتعشا", "سلمى" -> "سلما"
    processed = processed.replace(/(?<=[\u0621-\u064A]{3})ى(?=\s|[.,!؟:;]|$)/g, 'ا');

    return processed;
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
        // Prevents Arabic voice reading English text (Zulu accent issue)
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
        
        // Split by logical pauses for SSML breaks
        const paragraphs = text.split(/\n\s*\n/);
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            let cleanPara = para.trim();
            if (cleanPara) {
                // --- APPLY ARABIC STABILIZATION ---
                if (backendVoiceId.startsWith('ar-')) {
                    cleanPara = stabilizeArabicText(cleanPara);
                }

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
 * Generates multi-speaker audio with SMART ORDER MAPPING.
 * If names don't match exactly (e.g. "Yazan" in text vs "يزن" in settings),
 * it assigns the first detected name in text to Speaker 1, second to Speaker 2, etc.
 */
export async function generateMultiSpeakerStandardSpeech(
    text: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    defaultVoice: string,
    pauseDuration: number = 0.5 
): Promise<Uint8Array | null> {
    
    // 1. Analyze the Text to find "Dialogue Labels"
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;

    const detectedLabels = new Set<string>();
    const lineObjects: { rawLine: string, detectedLabel: string | null, content: string }[] = [];

    for (const line of lines) {
        const lineText = line.replace(/\u00A0/g, ' ').trim();
        let label = null;
        let content = lineText;

        // Find separator (colon)
        const colonIndex = lineText.indexOf(':');
        
        // Logic: A label must be at the start and reasonably short (e.g. < 40 chars)
        if (colonIndex > 0 && colonIndex < 40) {
            const rawLabel = lineText.substring(0, colonIndex).trim();
            // Store normalized lower-case label for consistent matching
            const cleanLabel = rawLabel.replace(/[*_"'`]/g, '').trim().toLowerCase();
            
            // Safety check: Labels shouldn't be too long (avoiding sentences that just happen to have a colon)
            // Typically a name is 1-3 words.
            if (cleanLabel.split(' ').length <= 4 && cleanLabel.length > 1) {
                detectedLabels.add(cleanLabel);
                label = cleanLabel;
                content = lineText.substring(colonIndex + 1).trim();
            }
        }
        
        lineObjects.push({ rawLine: lineText, detectedLabel: label, content: content });
    }

    // 2. Build the "Smart Map"
    // We map: Detected Text Label -> Voice ID
    const voiceMap: Record<string, string> = {};
    const uniqueLabels = Array.from(detectedLabels); // Order of appearance matters! e.g. ["yazan", "lana"]

    // Configured speakers in order (1, 2, 3, 4)
    const availableConfigs = [speakers.speakerA, speakers.speakerB, speakers.speakerC, speakers.speakerD].filter(Boolean);
    const usedConfigIndices = new Set<number>();

    // Pass 1: Strict/Fuzzy Matching (If user actually typed "Yazan" in settings, prioritize that)
    uniqueLabels.forEach(label => {
        const matchIndex = availableConfigs.findIndex(conf => {
            const confName = conf.name.trim().toLowerCase();
            return confName && (confName === label || label.includes(confName) || confName.includes(label));
        });

        if (matchIndex !== -1) {
            voiceMap[label] = availableConfigs[matchIndex].voice;
            usedConfigIndices.add(matchIndex);
        }
    });

    // Pass 2: Order-Based Fallback (The Fix for Yazan vs يزن)
    // If "Yazan" (1st label) wasn't matched strictly, assign it to Speaker A (1st config).
    // If "Lana" (2nd label) wasn't matched, assign it to Speaker B (2nd config).
    uniqueLabels.forEach(label => {
        if (!voiceMap[label]) {
            // Find the first config that hasn't been used yet
            const freeIndex = availableConfigs.findIndex((_, idx) => !usedConfigIndices.has(idx));
            if (freeIndex !== -1) {
                voiceMap[label] = availableConfigs[freeIndex].voice;
                usedConfigIndices.add(freeIndex);
            }
        }
    });

    // 3. Generate Segments using the Map
    const segments: { text: string, voice: string }[] = [];
    let currentVoice = defaultVoice; // Fallback if absolutely nothing matches

    // Optimization: If we successfully mapped the first label, start with that voice
    // This handles cases where the first line might be narration but followed by dialogue
    if (uniqueLabels.length > 0 && voiceMap[uniqueLabels[0]]) {
        // Optional: you could set currentVoice to the first speaker, 
        // but keeping defaultVoice is safer for narration headers.
    }

    for (const obj of lineObjects) {
        if (!obj.content) continue;

        let segmentVoice = currentVoice;

        // If this line has a label, switch voice
        if (obj.detectedLabel && voiceMap[obj.detectedLabel]) {
            segmentVoice = voiceMap[obj.detectedLabel];
            currentVoice = segmentVoice; // Persist for subsequent lines without labels
        }

        segments.push({ text: obj.content, voice: segmentVoice });
    }

    if (segments.length === 0) return null;

    // 4. Audio Generation & Stitching
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
            console.error(`Failed segment (${seg.voice}):`, e);
        }
    }

    if (audioBuffers.length === 0) return null;

    // Stitching
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
        if (i < audioBuffers.length - 1) offset += PAUSE_SAMPLES; 
    }

    const wavBlob = createWavBlob(outputBuffer, 1, ctx.sampleRate);
    const wavArrayBuffer = await wavBlob.arrayBuffer();
    
    return new Uint8Array(wavArrayBuffer);
}
