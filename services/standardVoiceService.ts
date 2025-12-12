
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
 * Generates multi-speaker audio by aggressively parsing "Name: Text" patterns using simple string splitting.
 */
export async function generateMultiSpeakerStandardSpeech(
    text: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    defaultVoice: string,
    pauseDuration: number = 0.5 
): Promise<Uint8Array | null> {
    
    // 1. Normalize Inputs (Handle different newline types)
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;

    const segments: { text: string, voice: string }[] = [];
    
    // Prepare map: Normalized Name -> Voice ID
    // We trim and lowercase names for better matching
    const speakerMap: Record<string, string> = {};
    const addSpeaker = (s?: SpeakerConfig) => {
        if (s && s.name && s.name.trim()) {
            speakerMap[s.name.trim().toLowerCase()] = s.voice;
        }
    };
    addSpeaker(speakers.speakerA);
    addSpeaker(speakers.speakerB);
    addSpeaker(speakers.speakerC);
    addSpeaker(speakers.speakerD);

    let currentVoice = defaultVoice; 

    // 2. ROBUST PARSING LOOP
    // Instead of Regex, we use simple IndexOf to find the separator.
    // This is safer against unicode issues and varying formatting.
    for (const line of lines) {
        // Normalize invisible characters like non-breaking spaces
        const lineText = line.replace(/\u00A0/g, ' ').trim();
        if (!lineText) continue;

        let content = lineText;
        
        // Find first colon or hyphen which usually separates Name from Dialogue
        // We prioritize Colon (:) as it's standard.
        const colonIndex = lineText.indexOf(':');
        
        // Safety Check: A name is usually short (e.g., < 40 chars). 
        // If the colon is at index 100, it's probably just a sentence with a colon, not a speaker label.
        if (colonIndex > 0 && colonIndex < 40) {
            const rawName = lineText.substring(0, colonIndex).trim();
            const textPart = lineText.substring(colonIndex + 1).trim();
            
            // Normalize found name for comparison
            // Remove markdown bold (**), quotes, etc.
            const cleanName = rawName.replace(/[*_"'`]/g, '').toLowerCase();

            // Try to find a voice match
            let matchedVoice = null;

            // Direct Match
            if (speakerMap[cleanName]) {
                matchedVoice = speakerMap[cleanName];
            } 
            // Fuzzy Match (e.g. Config="Yazan" matches Script="Yazan (Happy)")
            else {
                for (const confName of Object.keys(speakerMap)) {
                    // Check if ScriptName starts with ConfigName (e.g. "Yazan Happy" starts with "Yazan")
                    // OR ConfigName starts with ScriptName (rare but possible)
                    if (cleanName.startsWith(confName) || confName.startsWith(cleanName)) {
                        matchedVoice = speakerMap[confName];
                        break;
                    }
                }
            }

            if (matchedVoice) {
                currentVoice = matchedVoice;
            }

            // CRITICAL: Regardless of whether we matched a voice or not, 
            // if it looks like a script line (ShortName: ...), we STRIP the name.
            // This prevents "Yazan: ..." from being read aloud even if the voice mapping failed.
            content = textPart;
        }

        if (content.length > 0) {
            segments.push({ text: content, voice: currentVoice });
        }
    }

    if (segments.length === 0) return null;

    // 3. Generate Audio for each segment
    const audioBuffers: AudioBuffer[] = [];
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    for (const seg of segments) {
        try {
            // Generate using the specific voice for this segment
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

    // 4. Stitching
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
