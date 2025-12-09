
import { AudioSettings, AudioPreset, AudioPresetName } from '../types';

function convertInt16ToFloat32(incomingData: Uint8Array): Float32Array {
    const buffer = incomingData.byteOffset % 2 === 0 
        ? incomingData.buffer 
        : incomingData.buffer.slice(incomingData.byteOffset, incomingData.byteOffset + incomingData.byteLength);
        
    const int16Data = new Int16Array(buffer, incomingData.byteOffset % 2 === 0 ? incomingData.byteOffset : 0, incomingData.byteLength / 2);
    const output = new Float32Array(int16Data.length);

    for (let i = 0; i < int16Data.length; i++) {
        output[i] = int16Data[i] / 32768.0;
    }
    return output;
}

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
 * Plays audio data handling both MP3 (AWS) and Raw PCM (Gemini).
 */
export async function playAudio(
    inputData: Uint8Array,
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

        let buffer: AudioBuffer;

        try {
            // STRATEGY: Try to decode as a standard audio file first (MP3/WAV from AWS)
            // We must create a copy of the buffer because decodeAudioData detaches the array buffer
            const bufferCopy = inputData.slice(0).buffer;
            buffer = await audioContext.decodeAudioData(bufferCopy);
        } catch (e) {
            // FALLBACK: If decoding fails, assume it is Raw PCM (Gemini 24kHz 16-bit Mono)
            // Gemini sends raw PCM without headers, which decodeAudioData rejects.
            const float32Data = convertInt16ToFloat32(inputData);
            buffer = audioContext.createBuffer(1, float32Data.length, 24000);
            buffer.getChannelData(0).set(float32Data);
        }
        
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
        
        let safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
        if (safeOffset >= buffer.duration) {
             safeOffset = 0; 
        }
        
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

export function rawPcmToAudioBuffer(pcmData: Uint8Array): AudioBuffer {
    const float32Data = convertInt16ToFloat32(pcmData);
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
    try {
        // Try decoding as file format first (MP3/WAV)
        const bufferCopy = data.slice(0).buffer;
        // OfflineContext doesn't always have decodeAudioData in all envs, fallback to main ctx
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await tempCtx.decodeAudioData(bufferCopy);
        return decoded;
    } catch (e) {
        // Fallback to Raw PCM assumption
        return rawPcmToAudioBuffer(data);
    }
}

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
    input: Uint8Array | AudioBuffer | null,
    settings: AudioSettings,
    backgroundMusicBuffer: AudioBuffer | null = null,
    musicVolume: number = 40,
    autoDucking: boolean = false,
    voiceVolume: number = 80,
    trimToVoice: boolean = true,
    voiceDelay: number = 0, 
    echoAmount: number = 0 
): Promise<AudioBuffer> {
    // USE 44100Hz for better compatibility with MP3 encoders and players
    const renderSampleRate = 44100; 
    let initialSourceBuffer: AudioBuffer | null = null;

    // 1. DECODE SOURCE
    if (input instanceof Uint8Array) {
        try {
             const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
             const bufferCopy = input.slice(0).buffer;
             initialSourceBuffer = await tempCtx.decodeAudioData(bufferCopy);
        } catch(e) {
             initialSourceBuffer = rawPcmToAudioBuffer(input);
        }
    } else if (input instanceof AudioBuffer) {
        initialSourceBuffer = input;
    }
    
    const speed = (settings.speed && settings.speed > 0) ? settings.speed : 1.0;
    
    // --- 2. THE CUTOFF FIX: PHYSICAL PADDING ---
    // Instead of relying on timeline calculations, we Physically extend the voice buffer
    // by adding 2 seconds of silence to the actual audio data. 
    // This forces the renderer to process the "tail" even if it miscalculates end times.
    let sourceBuffer: AudioBuffer | null = null;
    
    if (initialSourceBuffer) {
        // Create a new buffer: Original Length + 2 Seconds of Silence
        const paddingSeconds = 2.0;
        const paddingSamples = Math.ceil(initialSourceBuffer.sampleRate * paddingSeconds);
        const newLength = initialSourceBuffer.length + paddingSamples;
        
        // Use OfflineContext to create buffer (safest way in non-window contexts)
        const tempCtx = new OfflineAudioContext(initialSourceBuffer.numberOfChannels, newLength, initialSourceBuffer.sampleRate);
        sourceBuffer = tempCtx.createBuffer(initialSourceBuffer.numberOfChannels, newLength, initialSourceBuffer.sampleRate);
        
        // Copy data
        for (let channel = 0; channel < initialSourceBuffer.numberOfChannels; channel++) {
            const originalData = initialSourceBuffer.getChannelData(channel);
            const newData = sourceBuffer.getChannelData(channel);
            newData.set(originalData); // Rest remains 0 (silence)
        }
    }

    // 3. CALCULATE DURATIONS
    const END_PADDING = 15.0; // Extra safety on top of physical padding
    let outputDuration = 1.0;
    let absoluteVoiceEnd = 0;
    
    // Effective end time of the *original content* (excluding our new physical padding)
    // We use initialSourceBuffer for calculation to key fade-outs correctly
    if (initialSourceBuffer) {
        absoluteVoiceEnd = voiceDelay + (initialSourceBuffer.duration / speed);
    }

    if (sourceBuffer && backgroundMusicBuffer) {
        if (trimToVoice) {
            outputDuration = absoluteVoiceEnd + END_PADDING;
        } else {
            outputDuration = Math.max(absoluteVoiceEnd + END_PADDING, backgroundMusicBuffer.duration);
        }
    } else if (sourceBuffer) {
        outputDuration = absoluteVoiceEnd + END_PADDING;
    } else if (backgroundMusicBuffer) {
        outputDuration = backgroundMusicBuffer.duration;
    }
    
    if (!Number.isFinite(outputDuration) || outputDuration < 1.0) outputDuration = 1.0;

    // 4. SETUP RENDER CONTEXT
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(renderSampleRate * outputDuration), renderSampleRate);

    // --- VOICE CHAIN ---
    if (sourceBuffer && voiceVolume > 0) {
        const source = offlineCtx.createBufferSource();
        source.buffer = sourceBuffer;
        source.playbackRate.value = speed;

        const voiceGain = offlineCtx.createGain();
        voiceGain.gain.value = (voiceVolume / 100); 

        // SMART BYPASS: Only create processing nodes if needed
        const hasEq = settings.eqBands.some(v => v !== 0);
        const hasCompression = settings.compression > 0;
        const hasReverb = settings.reverb > 0;
        const hasEcho = echoAmount > 0;
        const hasPan = settings.stereoWidth !== 0;

        let headNode: AudioNode = source;

        // EQ
        if (hasEq) {
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
            filters.forEach(f => { headNode.connect(f); headNode = f; });
        }

        // Dynamics
        if (hasCompression) {
            const compressor = offlineCtx.createDynamicsCompressor();
            const compAmount = settings.compression / 100; 
            compressor.threshold.value = -10 - (compAmount * 40); 
            compressor.ratio.value = 1 + (compAmount * 11);       
            compressor.attack.value = 0.003; 
            compressor.release.value = 0.25;
            headNode.connect(compressor);
            headNode = compressor;
        }

        const dryNode = headNode;

        // Reverb
        if (hasReverb) {
            const reverbNode = offlineCtx.createConvolver();
            const reverbGain = offlineCtx.createGain(); 
            const dryGain = offlineCtx.createGain();    
            
            const revDuration = 1.5 + (settings.reverb / 100) * 2.0; 
            reverbNode.buffer = createImpulseResponse(offlineCtx, revDuration, 2.0, false);
            
            const mix = settings.reverb / 100;
            reverbGain.gain.value = mix;
            dryGain.gain.value = 1 - (mix * 0.5); 

            dryNode.connect(reverbNode);
            reverbNode.connect(reverbGain);
            dryNode.connect(dryGain);
            
            const reverbMerge = offlineCtx.createGain();
            reverbGain.connect(reverbMerge);
            dryGain.connect(reverbMerge);
            headNode = reverbMerge;
        }

        // Echo
        if (hasEcho) {
            const delayNode = offlineCtx.createDelay();
            delayNode.delayTime.value = 0.4;
            const feedbackNode = offlineCtx.createGain();
            feedbackNode.gain.value = 0.3;
            const echoGain = offlineCtx.createGain();
            echoGain.gain.value = echoAmount / 100;

            delayNode.connect(feedbackNode);
            feedbackNode.connect(delayNode);
            headNode.connect(delayNode);
            delayNode.connect(echoGain);
            
            const echoMerge = offlineCtx.createGain();
            headNode.connect(echoMerge);
            echoGain.connect(echoMerge);
            headNode = echoMerge;
        }
        
        // Panner
        if (hasPan) {
            const panner = offlineCtx.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, settings.stereoWidth / 100));
            headNode.connect(panner);
            headNode = panner;
        }
        
        headNode.connect(voiceGain);
        voiceGain.connect(offlineCtx.destination);
        source.start(voiceDelay);
    }
    
    // --- MUSIC CHAIN ---
    if (backgroundMusicBuffer && musicVolume > 0) {
        const musicSource = offlineCtx.createBufferSource();
        musicSource.buffer = backgroundMusicBuffer;
        musicSource.loop = outputDuration > backgroundMusicBuffer.duration;
        
        const musicGain = offlineCtx.createGain();
        const startVolume = (musicVolume / 100);
        musicGain.gain.setValueAtTime(startVolume, 0);

        // --- PRO AUTO DUCKING (With Gap Bridging) ---
        if (autoDucking && sourceBuffer && voiceVolume > 0) {
            const channelData = sourceBuffer.getChannelData(0);
            const sampleRate = sourceBuffer.sampleRate;
            
            const duckLevel = startVolume * 0.2;
            const threshold = 0.005; 
            
            const windowSize = Math.floor(sampleRate * 0.1); 
            const speechBlocks: {start: number, end: number}[] = [];
            let inSpeech = false;
            let startT = 0;

            // Important: Analyze ONLY the original length (ignore the silence padding we added)
            const analysisLength = initialSourceBuffer ? initialSourceBuffer.length : channelData.length;

            for (let i = 0; i < analysisLength; i += windowSize) {
                let sum = 0;
                const end = Math.min(i + windowSize, analysisLength);
                for (let j = i; j < end; j++) {
                    const s = channelData[j];
                    sum += s * s;
                }
                const rms = Math.sqrt(sum / (end - i));
                
                const bufferTime = i / sampleRate;
                const absoluteTime = voiceDelay + (bufferTime / speed);

                if (rms > threshold) {
                    if (!inSpeech) {
                        inSpeech = true;
                        startT = absoluteTime;
                    }
                } else {
                    if (inSpeech) {
                        inSpeech = false;
                        speechBlocks.push({ start: startT, end: absoluteTime });
                    }
                }
            }
            if (inSpeech) {
                speechBlocks.push({ start: startT, end: voiceDelay + (analysisLength / sampleRate / speed) });
            }

            // Gap Bridging (1.2s Rule)
            const mergedBlocks: {start: number, end: number}[] = [];
            if (speechBlocks.length > 0) {
                let currentBlock = speechBlocks[0];
                for (let i = 1; i < speechBlocks.length; i++) {
                    const nextBlock = speechBlocks[i];
                    const gap = nextBlock.start - currentBlock.end;
                    
                    if (gap < 1.2) { 
                        currentBlock.end = nextBlock.end; 
                    } else {
                        mergedBlocks.push(currentBlock);
                        currentBlock = nextBlock;
                    }
                }
                mergedBlocks.push(currentBlock);
            }

            // Apply Automation
            const attackTime = 0.05; // Instant attack
            const releaseTime = 1.0; // Slow release

            for (const block of mergedBlocks) {
                // LOOK AHEAD: Drop music 0.5s BEFORE voice starts
                const duckStart = Math.max(0, block.start - 0.5);
                const duckEnd = block.end + 0.5;

                musicGain.gain.setValueAtTime(startVolume, duckStart);
                musicGain.gain.linearRampToValueAtTime(duckLevel, duckStart + attackTime);
                musicGain.gain.setValueAtTime(duckLevel, duckEnd);
                musicGain.gain.linearRampToValueAtTime(startVolume, duckEnd + releaseTime);
            }
        }

        // Final Fade Out logic
        if (trimToVoice && sourceBuffer) {
            // Wait 5 seconds after the REAL voice ends before fading music
            const safeFadeStart = absoluteVoiceEnd + 5.0; 
            try { 
                musicGain.gain.cancelScheduledValues(safeFadeStart); 
                musicGain.gain.setValueAtTime(musicGain.gain.value, safeFadeStart);
            } catch(e){}
            musicGain.gain.linearRampToValueAtTime(0.0001, safeFadeStart + 5.0); 
        }
        
        musicSource.connect(musicGain);
        musicGain.connect(offlineCtx.destination);
        musicSource.start(0);
    }

    return await offlineCtx.startRendering();
}

export function createWavBlob(data: Uint8Array | AudioBuffer, numChannels: number, sampleRate: number): Blob {
    let samples: Float32Array;
    let channels = numChannels;
    let rate = sampleRate;

    if (data instanceof AudioBuffer) {
        samples = interleave(data);
        channels = data.numberOfChannels;
        rate = data.sampleRate;
    } else {
        // Fallback for Gemini Raw PCM
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

export function createMp3Blob(buffer: AudioBuffer | Uint8Array, numChannels: number, sampleRate: number, bitrate: number = 192): Promise<Blob> {
    return new Promise((resolve, reject) => {
        try {
            const lamejs = (window as any).lamejs;
            if (!lamejs) throw new Error("lamejs not loaded");

            // If it's already a Uint8Array but NOT an AudioBuffer, it might be raw PCM from Gemini.
            // OR it could be an MP3 file bytes from AWS. 
            // NOTE: This function expects RAW AUDIO DATA (samples), not file bytes.
            // If we are passing AWS MP3 bytes here, we should have decoded them to AudioBuffer first using processAudio.
            
            let channels = numChannels;
            let rate = sampleRate;
            let leftData: Int16Array;
            let rightData: Int16Array | undefined;

            const floatTo16BitPCM = (input: Float32Array) => {
                const output = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                return output;
            };

            if (buffer instanceof AudioBuffer) {
                channels = buffer.numberOfChannels;
                rate = buffer.sampleRate;
                leftData = floatTo16BitPCM(buffer.getChannelData(0));
                if (channels > 1) {
                    rightData = floatTo16BitPCM(buffer.getChannelData(1));
                }
            } else {
                // Fallback for Raw PCM (Gemini)
                // Assume 24kHz Mono
                rate = 24000;
                channels = 1;
                const b = buffer.byteLength % 2 === 0 ? buffer : buffer.subarray(0, buffer.byteLength - 1);
                leftData = new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2);
            }

            const mp3encoder = new lamejs.Mp3Encoder(channels, rate, bitrate);
            const mp3Data = [];
            const sampleBlockSize = 1152; 
            
            for (let i = 0; i < leftData.length; i += sampleBlockSize) {
                const leftChunk = leftData.subarray(i, i + sampleBlockSize);
                let mp3buf;
                
                if (channels === 2 && rightData) {
                    const rightChunk = rightData.subarray(i, i + sampleBlockSize);
                    mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                } else {
                    mp3buf = mp3encoder.encodeBuffer(leftChunk);
                }
                
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            
            const endBuf = mp3encoder.flush();
            if (endBuf.length > 0) mp3Data.push(endBuf);

            resolve(new Blob(mp3Data, { type: 'audio/mpeg' }));

        } catch (e) {
            console.error("MP3 Encoding failed:", e);
            reject(e);
        }
    });
}

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
