
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
 * INTELLIGENT LOCALE MAPPING based on User Quality Report.
 * - 'Good' voices keep their native locale (e.g. Omani, Syrian).
 * - 'Bad/Mixed' voices are forced to 'ar-SA' (Standard Arabic) to fix pronunciation (Jeem vs G, Thick Alif).
 */
function getOptimizedLocale(voiceId: string): string {
    // 1. GOOD VOICES (Keep Native)
    if (voiceId.includes('ar-OM')) return 'ar-OM'; // Omani (Good)
    if (voiceId.includes('ar-SY')) return 'ar-SY'; // Syrian (Good)
    if (voiceId.includes('ar-MA')) return 'ar-MA'; // Moroccan (Good)
    if (voiceId.includes('ar-DZ')) return 'ar-DZ'; // Algerian (Good)
    if (voiceId.includes('ar-TN')) return 'ar-TN'; // Tunisian (Good)
    if (voiceId.includes('ar-YE')) return 'ar-YE'; // Yemeni (Good/Mixed but acceptable)
    
    // 2. PROBLEMATIC VOICES (Force Standard Arabic 'ar-SA' to fix accent/pronunciation)
    // Fixes: "Mama" thinning, "J" becoming "G" (Egyptian), "Layla" eating letters.
    if (voiceId.includes('ar-EG')) return 'ar-SA'; // Salma/Shakir -> Force SA to stop "G" sound in MSA
    if (voiceId.includes('ar-JO')) return 'ar-SA'; // Taim/Sana -> Force SA to fix dialect mix
    if (voiceId.includes('ar-LB')) return 'ar-SA'; // Layla/Rami -> Force SA (Lebanese model is very weak)
    if (voiceId.includes('ar-BH')) return 'ar-SA'; // Ali/Laila -> Force SA
    if (voiceId.includes('ar-QA')) return 'ar-SA'; // Amal/Moaz -> Force SA
    if (voiceId.includes('ar-KW')) return 'ar-SA'; // Fahed/Noura -> Force SA

    // 3. SEMI-CORRECT (Saudi/UAE) - Keep as is, they are the reference.
    if (voiceId.includes('ar-SA')) return 'ar-SA';
    if (voiceId.includes('ar-AE')) return 'ar-AE';

    // Default fallback
    const parts = voiceId.split('-');
    return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'en-US';
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

        // Determine the best engine locale to use
        const langCode = getOptimizedLocale(voiceId);

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
                azureStyle = 'empathetic'; 
                rate = '-10%'; // Slightly faster than before to prevent robotic drag
                pitch = '-2%'; // Deeper for authority
                break;
            case 'heritage_narrator':
                azureStyle = 'narration-professional'; 
                rate = '-5%'; 
                pitch = '-2%'; 
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

        const paragraphs = text.split(/\n\s*\n/);
        
        let innerContent = '';
        
        paragraphs.forEach((para, index) => {
            let cleanPara = para.trim();
            if (cleanPara) {
                // --- POETRY RHYME HACK (The Ishba' Fix) ---
                if (emotion === 'epic_poet') {
                    cleanPara = cleanPara.replace(/[.!?؟,،]+$/, '');
                    if (/[\u064F]$/.test(cleanPara)) { // Ends with Damma (ُ)
                        cleanPara += 'و'; 
                    } else if (/[\u0650]$/.test(cleanPara)) { // Ends with Kasra (ِ)
                        cleanPara += 'ي';
                    } else if (/[\u064E]$/.test(cleanPara)) { // Ends with Fatha (َ)
                        cleanPara += 'ا';
                    }
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
        
        // Construct the final full SSML
        // CRITICAL: We use the `langCode` (which might be forced to ar-SA) for the xml:lang
        // but we keep the `voiceId` specific. This forces the Saudi/Standard engine rules
        // onto the specific voice actor.
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
