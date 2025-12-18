
import { decode, createWavBlob } from '../utils/audioUtils';
import { SpeakerConfig } from '../types';

/**
 * وظيفة لتطهير النص من الرموز التي لا يجب نطقها
 */
function scrubTextForSpeech(text: string): string {
    return text
        .replace(/\*\*/g, '') 
        .replace(/\*/g, '')   
        .replace(/__/g, '')   
        .replace(/#/g, '')    
        .replace(/\[|\]/g, '') 
        .replace(/`+/g, '')   
        .trim();
}

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

// --- تم حذف QUALITY_MAPPING لاستعادة التنوع الحقيقي ---

function getOptimizedLocale(voiceId: string): string {
    const parts = voiceId.split('-');
    if (parts.length >= 2) {
        return `${parts[0]}-${parts[1]}`;
    }
    return 'ar-SA';
}

/**
 * Detects if text is predominantly English/Latin.
 * تم تحسين الحساسية لتجنب التبديل الخاطئ
 */
function isTextEnglish(text: string): boolean {
    const latinMatch = text.match(/[a-zA-Z]/g);
    const arabicMatch = text.match(/[\u0600-\u06FF]/g);
    const latinCount = latinMatch ? latinMatch.length : 0;
    const arabicCount = arabicMatch ? arabicMatch.length : 0;
    return latinCount > (arabicCount * 2) && latinCount > 10;
}

/**
 * Stabilizes Arabic Text for TTS Engines.
 * تم تخفيف حدة السكون لجعل الكلام أكثر طبيعية وتنوعاً
 */
function stabilizeArabicText(text: string): string {
    let processed = scrubTextForSpeech(text);
    // إضافة سكون خفيف فقط عند نهايات الجمل الواضحة لضمان الوقوف الصحيح
    processed = processed.replace(/([.,!؟])(?=\s|$)/g, '\u0652$1');
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
        let backendVoiceId = voiceId; 
        let cleanText = scrubTextForSpeech(text);

        // --- SMART LANGUAGE GUARD ---
        // يحمي المستخدم من اختيار صوت عربي لنص إنجليزي طويل والعكس
        if (backendVoiceId.startsWith('ar-') && isTextEnglish(cleanText)) {
            backendVoiceId = 'en-US-AndrewNeural'; 
        }

        const langCode = getOptimizedLocale(backendVoiceId);
        let payload: any = { voiceId: backendVoiceId };

        let azureStyle = '';
        let pitch = '0%';
        let baseRate = 0;

        switch (emotion) {
            case 'happy': azureStyle = 'cheerful'; break;
            case 'sad': azureStyle = 'sad'; break;
            case 'formal': azureStyle = 'newscast'; break;
        }

        const rate = `${baseRate}%`;
        const paragraphs = cleanText.split(/\n\s*\n/);
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            let cleanPara = para.trim();
            if (cleanPara) {
                if (backendVoiceId.startsWith('ar-')) {
                    cleanPara = stabilizeArabicText(cleanPara);
                }
                innerContent += escapeXml(cleanPara);
                if (index < paragraphs.length - 1 && pauseDuration > 0) {
                    innerContent += `<break time="${Math.round(pauseDuration * 1000)}ms"/>`;
                }
            }
        });

        const fullSSML = `
            <speak version='1.0' xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang='${langCode}'>
                <voice xml:lang='${langCode}' name='${backendVoiceId}'>
                    <prosody rate="${rate}" pitch="${pitch}">
                        ${azureStyle ? `<mstts:express-as style="${azureStyle}">${innerContent}</mstts:express-as>` : innerContent}
                    </prosody>
                </voice>
            </speak>
        `;
        payload.ssml = fullSSML;

        const response = await fetch('/api/speak-azure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Azure error: ${response.status}`);
        const data = await response.json();
        return data.audioContent ? decode(data.audioContent) : null;

    } catch (error) {
        console.error("Azure Speech Failed:", error);
        throw error;
    }
}

export async function generateMultiSpeakerStandardSpeech(
    text: string,
    speakers: { speakerA: SpeakerConfig, speakerB: SpeakerConfig, speakerC?: SpeakerConfig, speakerD?: SpeakerConfig },
    defaultVoice: string,
    pauseDuration: number = 0.5 
): Promise<Uint8Array | null> {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return null;

    const detectedLabels = new Set<string>();
    const lineObjects: { rawLine: string, detectedLabel: string | null, content: string }[] = [];

    for (const line of lines) {
        const lineText = line.replace(/\u00A0/g, ' ').trim();
        let label = null;
        let content = lineText;

        const colonIndex = lineText.indexOf(':');
        if (colonIndex > 0 && colonIndex < 40) {
            const rawLabel = lineText.substring(0, colonIndex).trim();
            const cleanLabel = rawLabel.replace(/[*_"'`]/g, '').trim().toLowerCase();
            if (cleanLabel.split(' ').length <= 4 && cleanLabel.length > 1) {
                detectedLabels.add(cleanLabel);
                label = cleanLabel;
                content = lineText.substring(colonIndex + 1).trim();
            }
        }
        lineObjects.push({ rawLine: lineText, detectedLabel: label, content: scrubTextForSpeech(content) });
    }

    const voiceMap: Record<string, string> = {};
    const uniqueLabels = Array.from(detectedLabels);
    const availableConfigs = [speakers.speakerA, speakers.speakerB, speakers.speakerC, speakers.speakerD].filter(Boolean);
    const usedConfigIndices = new Set<number>();

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

    uniqueLabels.forEach(label => {
        if (!voiceMap[label]) {
            const freeIndex = availableConfigs.findIndex((_, idx) => !usedConfigIndices.has(idx));
            if (freeIndex !== -1) {
                voiceMap[label] = availableConfigs[freeIndex].voice;
                usedConfigIndices.add(freeIndex);
            }
        }
    });

    const segments: { text: string, voice: string }[] = [];
    let currentVoice = defaultVoice;

    for (const obj of lineObjects) {
        if (!obj.content) continue;
        let segmentVoice = currentVoice;
        if (obj.detectedLabel && voiceMap[obj.detectedLabel]) {
            segmentVoice = voiceMap[obj.detectedLabel];
            currentVoice = segmentVoice;
        }
        segments.push({ text: obj.content, voice: segmentVoice });
    }

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
