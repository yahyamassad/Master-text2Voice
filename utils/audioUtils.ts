
import { AudioSettings, AudioPreset, AudioPresetName } from '../types';

// This tells TypeScript that the 'lamejs' object is available globally.
// declare const lamejs: any; 

/**
 * Converts raw Int16 PCM data (bytes) into Float32Array (-1.0 to 1.0).
 * Gemini returns Linear-16 (16-bit signed integers).
 * We use Int16Array directly which handles system endianness automatically.
 */
function convertInt16ToFloat32(incomingData: Uint8Array): Float32Array {
    // Create an Int16 view of the buffer. 
    // Note: This assumes the system endianness matches the stream (usually Little Endian).
    // If incomingData offset is not aligned to 2 bytes, we must slice it.
    const buffer = incomingData.byteOffset % 2 === 0 
        ? incomingData.buffer 
        : incomingData.buffer.slice(incomingData.byteOffset, incomingData.byteOffset + incomingData.byteLength);
        
    const int16Data = new Int16Array(buffer, incomingData.byteOffset % 2 === 0 ? incomingData.byteOffset : 0, incomingData.byteLength / 2);
    const output = new Float32Array(int16Data.length);

    // Normalize to range [-1.0, 1.0]
    for (let i = 0; i < int16Data.length; i++) {
        output[i] = int16Data[i] / 32768.0;
    }
    return output;
}

/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decode(base64: string): Uint8Array {
  try {
      const cleanBase64 = base64.replace(/[\r\n\s]/g, '');
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  } catch (e) {
      console.error("Failed to decode base64 string:", e);
      return new Uint8Array(0);
  }
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Plays raw PCM audio data by converting it to an AudioBuffer manually.
 * STRICTLY ENFORCES 24000Hz (Gemini Native).
 */
export async function playAudio(
    pcmData: Uint8Array,
    existingContext: AudioContext | null,
    onEnded: () => void,
    speed: number = 1.0, 
    offset: number = 0
): Promise<AudioBufferSourceNode | null> {
    let audioContext: AudioContext;

    try {
        if (existingContext) {
            audioContext = existingContext;
        } else {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // 1. Convert raw Int16 bytes to Float32 audio data
        const float32Data = convertInt16ToFloat32(pcmData);

        // 2. Create an AudioBuffer with strict 24000Hz sample rate
        // If we don't specify 24000, the browser assumes 44100/48000 and plays it 2x speed (Chipmunk).
        // If "Cow" sound happens, it usually means data corruption or extremely low rate interpretation.
        // We explicitly set 24000 here.
        const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
        
        // 3. Fill the buffer
        buffer.getChannelData(0).set(float32Data);
        
        // 4. Create Source
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        if (Number.isFinite(speed) && speed > 0) {
            source.playbackRate.value = speed;
        }

        source.connect(audioContext.destination);
        
        source.onended = () => {
             if (!existingContext && audioContext.state !== 'closed') {
                audioContext.close().catch(() => {});
            }
            try { source.disconnect(); } catch(e){}
            onEnded();
        };
        
        // Handle offset for resuming
        let safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
        if (safeOffset >= buffer.duration) {
             safeOffset = 0; 
        }
        
        // Start playback
        source.start(0, safeOffset);
        return source;
    } catch (e) {
        console.error("Error playing audio:", e);
        if (!existingContext && audioContext! && audioContext!.state !== 'closed') {
            audioContext!.close().catch(() => {});
        }
        onEnded(); 
        return null;
    }
}

/**
 * Helper to manually wrap Float32 data into a dummy AudioBuffer for offline processing.
 */
export function rawPcmToAudioBuffer(pcmData: Uint8Array): AudioBuffer {
    const float32Data = convertInt16ToFloat32(pcmData);
    // Offline context to create buffer instance
    const tempCtx = new OfflineAudioContext(1, float32Data.length || 1, 24000);
    const buffer = tempCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);
    return buffer;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext | OfflineAudioContext,
  sampleRate: number = 24000, 
  numChannels: number = 1,
): Promise<AudioBuffer> {
    // Try to decode as a file first (e.g. Uploaded MP3/WAV)
    try {
        // We need a buffer copy because decodeAudioData detaches it
        const bufferCopy = data.slice(0).buffer;
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await tempCtx.decodeAudioData(bufferCopy);
        tempCtx.close();
        return decoded;
    } catch (e) {
        // If decoding fails, assume it's raw PCM and convert manually
        return rawPcmToAudioBuffer(data);
    }
}

// --- REAL TIME DSP FUNCTIONS ---

function createImpulseResponse(ctx: BaseAudioContext, duration: number, decay: number, reverse: boolean): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        const amount = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        left[i] = amount;
        right[i] = amount;
    }
    return impulse;
}

export async function processAudio(
    input: Uint8Array | AudioBuffer,
    settings: AudioSettings
): Promise<AudioBuffer> {
    const renderSampleRate = 44100;
    let sourceBuffer: AudioBuffer;

    if (input instanceof Uint8Array) {
        sourceBuffer = rawPcmToAudioBuffer(input);
    } else {
        sourceBuffer = input;
    }
    
    const speed = settings.speed || 1.0;
    const reverbTail = settings.reverb > 0 ? 2.0 : 0.1;
    const outputDuration = (sourceBuffer.duration / speed) + reverbTail;
    
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(renderSampleRate * outputDuration), renderSampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = sourceBuffer;
    source.playbackRate.value = speed;

    // -- EQ (5 Bands) --
    const frequencies = [60, 250, 1000, 4000, 12000];
    const filters = frequencies.map((freq, i) => {
        const filter = offlineCtx.createBiquadFilter();
        if (i === 0) filter.type = 'lowshelf';
        else if (i === 4) filter.type = 'highshelf';
        else filter.type = 'peaking';
        
        filter.frequency.value = freq;
        filter.gain.value = settings.eqBands[i] || 0;
        filter.Q.value = 1.0;
        return filter;
    });

    // -- Compressor --
    const compressor = offlineCtx.createDynamicsCompressor();
    const compAmount = settings.compression / 100; 
    
    compressor.threshold.value = -10 - (compAmount * 40); 
    compressor.ratio.value = 1 + (compAmount * 11);       
    compressor.attack.value = 0.003; 
    compressor.release.value = 0.25;
    compressor.knee.value = 30;

    // -- Reverb --
    const reverbNode = offlineCtx.createConvolver();
    const reverbGain = offlineCtx.createGain(); 
    const dryGain = offlineCtx.createGain();    
    
    if (settings.reverb > 0) {
        const revDuration = 1.5 + (settings.reverb / 100) * 2.0; 
        reverbNode.buffer = createImpulseResponse(offlineCtx, revDuration, 2.0, false);
        
        const mix = settings.reverb / 100;
        reverbGain.gain.value = mix;
        dryGain.gain.value = 1 - (mix * 0.5); 
    } else {
        reverbGain.gain.value = 0;
        dryGain.gain.value = 1;
    }

    // -- Master Volume --
    const masterGain = offlineCtx.createGain();
    const makeupGain = settings.compression > 50 ? 1.2 : 1.0;
    masterGain.gain.value = (settings.volume / 50) * makeupGain;

    // Connect Graph
    let currentNode: AudioNode = source;
    filters.forEach(f => {
        currentNode.connect(f);
        currentNode = f;
    });

    currentNode.connect(compressor);

    compressor.connect(reverbNode);
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);

    compressor.connect(dryGain);
    dryGain.connect(masterGain);

    masterGain.connect(offlineCtx.destination);

    source.start(0);
    return await offlineCtx.startRendering();
}

export async function playProcessedAudio(
    buffer: AudioBuffer,
    existingContext: AudioContext | null,
    onEnded: () => void
): Promise<{ source: AudioBufferSourceNode, gainNode: GainNode }> {
     let audioContext: AudioContext;
     if (existingContext) {
        audioContext = existingContext;
    } else {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.onended = onEnded;
    source.start(0);
    
    return { source, gainNode };
}

// --- FILE CREATION ---

export function createWavBlob(data: Uint8Array | AudioBuffer, numChannels: number, sampleRate: number): Blob {
    let samples: Float32Array;
    let channels = numChannels;
    let rate = sampleRate;

    if (data instanceof AudioBuffer) {
        samples = interleave(data);
        channels = data.numberOfChannels;
        rate = data.sampleRate;
    } else {
        // If it's raw PCM (Uint8), convert to Float32 first
        samples = convertInt16ToFloat32(data);
        rate = 24000; 
        channels = 1;
    }
    
    return createWavBlobFromFloat32(samples, channels, rate);
}

function interleave(inputBuffer: AudioBuffer): Float32Array {
    const numChannels = inputBuffer.numberOfChannels;
    const length = inputBuffer.length * numChannels;
    const result = new Float32Array(length);
    for (let i = 0; i < inputBuffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            result[i * numChannels + channel] = inputBuffer.getChannelData(channel)[i];
        }
    }
    return result;
}

function createWavBlobFromFloat32(samples: Float32Array, numChannels: number, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(44 + i * 2, s, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

export function createMp3Blob(buffer: AudioBuffer | Uint8Array, numChannels: number, sampleRate: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const lamejs = (window as any).lamejs;
            if (!lamejs) throw new Error("lamejs not loaded");

            let mp3encoder: any;
            let pcmData: Int16Array;
            let rate = sampleRate;
            
            // Standardize to Int16 for LAME
            if (buffer instanceof AudioBuffer) {
                const ch0 = buffer.getChannelData(0);
                pcmData = new Int16Array(ch0.length);
                for (let i = 0; i < ch0.length; i++) {
                    let s = Math.max(-1, Math.min(1, ch0[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                rate = buffer.sampleRate;
                mp3encoder = new lamejs.Mp3Encoder(1, rate, 128);
            } else {
                // Raw PCM is ALREADY Int16, just mapped as Uint8 bytes
                // Ensure byte alignment
                const b = buffer.byteLength % 2 === 0 ? buffer : buffer.subarray(0, buffer.byteLength - 1);
                pcmData = new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2);
                rate = 24000;
                mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128);
            }

            const mp3Data = [];
            const sampleBlockSize = 1152;
            for (let i = 0; i < pcmData.length; i += sampleBlockSize) {
                const chunk = pcmData.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(chunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            
            const endBuf = mp3encoder.flush();
            if (endBuf.length > 0) mp3Data.push(endBuf);

            resolve(new Blob(mp3Data, { type: 'audio/mpeg' }));

        } catch (e) {
            reject(e);
        }
    });
}

// --- PRESETS ---
export const AUDIO_PRESETS: AudioPreset[] = [
    {
        name: 'Default',
        label: { en: 'Original', ar: 'الأصلي' },
        settings: { volume: 50, speed: 1.0, pitch: 0, eqBands: [0, 0, 0, 0, 0], reverb: 0, compression: 0, stereoWidth: 0 }
    },
    {
        name: 'YouTube',
        label: { en: 'YouTube (Clean)', ar: 'يوتيوب (واضح)' },
        settings: { volume: 80, speed: 1.0, pitch: 0, eqBands: [0, 3, 0, 2, 1], reverb: 2, compression: 25, stereoWidth: 0 }
    },
    {
        name: 'Podcast',
        label: { en: 'Podcast (Warm)', ar: 'بودكاست (دافئ)' },
        settings: { volume: 85, speed: 1.0, pitch: 0, eqBands: [4, 3, 1, 0, -2], reverb: 3, compression: 35, stereoWidth: 0 }
    },
    {
        name: 'SocialMedia',
        label: { en: 'Social (Punchy)', ar: 'سوشيال (قوي)' },
        settings: { volume: 95, speed: 1.05, pitch: 0, eqBands: [1, 3, 0, 4, 2], reverb: 0, compression: 55, stereoWidth: 0 }
    },
    {
        name: 'Cinema',
        label: { en: 'Cinema (Epic)', ar: 'سينما (ملحمي)' },
        settings: { volume: 75, speed: 0.95, pitch: 0, eqBands: [5, 0, 1, 1, 3], reverb: 15, compression: 15, stereoWidth: 0 }
    },
    {
        name: 'Telephone',
        label: { en: 'Telephone', ar: 'هاتف' },
        settings: { volume: 65, speed: 1.0, pitch: 0, eqBands: [-12, -4, 6, -4, -12], reverb: 0, compression: 80, stereoWidth: 0 }
    },
    {
        name: 'Gaming',
        label: { en: 'Gaming/Stream', ar: 'ألعاب/بث' },
        settings: { volume: 90, speed: 1.0, pitch: 0, eqBands: [2, 0, 0, 5, 2], reverb: 0, compression: 45, stereoWidth: 0 }
    },
    {
        name: 'ASMR',
        label: { en: 'ASMR (Soft)', ar: 'همس (ASMR)' },
        settings: { volume: 85, speed: 1.0, pitch: 0, eqBands: [1, 0, -2, 3, 5], reverb: 10, compression: 70, stereoWidth: 0 }
    }
];
