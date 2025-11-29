

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

        const float32Data = convertInt16ToFloat32(pcmData);
        const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
        buffer.getChannelData(0).set(float32Data);
        
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
        const bufferCopy = data.slice(0).buffer;
        const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await tempCtx.decodeAudioData(bufferCopy);
        return decoded;
    } catch (e) {
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
    voiceDelay: number = 0 // Delay in seconds
): Promise<AudioBuffer> {
    // USE 44100Hz for better compatibility with MP3 encoders and players
    const renderSampleRate = 44100; 
    let sourceBuffer: AudioBuffer | null = null;

    if (input instanceof Uint8Array) {
        sourceBuffer = rawPcmToAudioBuffer(input);
    } else if (input instanceof AudioBuffer) {
        sourceBuffer = input;
    }
    
    // Safety check for speed to prevent division by zero
    const speed = (settings.speed && settings.speed > 0) ? settings.speed : 1.0;
    
    // Increased reverb tail padding significantly to prevent cutoffs
    const reverbTail = settings.reverb > 0 ? 5.0 : 2.5; 
    
    // Fade out duration for music
    const FADE_OUT_DURATION = 3.0; 
    
    let outputDuration = 1.0;
    let voiceEndTime = 0;
    
    // Calculate effective voice duration including speed changes
    if (sourceBuffer) {
        voiceEndTime = voiceDelay + (sourceBuffer.duration / speed) + reverbTail;
    }
    
    if (sourceBuffer && backgroundMusicBuffer) {
        if (trimToVoice) {
            // Trim mode: Duration = End of voice + Fade Out + Safety Buffer
            // We add extra 4 seconds to be absolutely sure no words are cut
            outputDuration = voiceEndTime + FADE_OUT_DURATION + 4.0; 
        } else {
            // Full mode: Duration is the longest of either (voice + delay) or music
            outputDuration = Math.max(voiceEndTime, backgroundMusicBuffer.duration);
        }
    } else if (sourceBuffer) {
        outputDuration = voiceEndTime + 2.0; // Extra padding for voice only too
    } else if (backgroundMusicBuffer) {
        outputDuration = backgroundMusicBuffer.duration;
    }
    
    // Ensure minimum duration
    if (!Number.isFinite(outputDuration) || outputDuration < 1.0) outputDuration = 1.0;

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(renderSampleRate * outputDuration), renderSampleRate);

    // --- VOICE CHAIN ---
    if (sourceBuffer && voiceVolume > 0) {
        const source = offlineCtx.createBufferSource();
        source.buffer = sourceBuffer;
        source.playbackRate.value = speed;

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

        const compressor = offlineCtx.createDynamicsCompressor();
        const compAmount = settings.compression / 100; 
        compressor.threshold.value = -10 - (compAmount * 40); 
        compressor.ratio.value = 1 + (compAmount * 11);       
        compressor.attack.value = 0.003; 
        compressor.release.value = 0.25;

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

        const voiceGain = offlineCtx.createGain();
        voiceGain.gain.value = (voiceVolume / 100); 
        
        let currentNode: AudioNode = source;
        filters.forEach(f => { currentNode.connect(f); currentNode = f; });
        currentNode.connect(compressor);
        compressor.connect(reverbNode);
        reverbNode.connect(reverbGain);
        reverbGain.connect(voiceGain);
        compressor.connect(dryGain);
        dryGain.connect(voiceGain);
        
        voiceGain.connect(offlineCtx.destination);
        
        // Start with delay
        source.start(voiceDelay);
    }
    
    // --- MUSIC CHAIN ---
    if (backgroundMusicBuffer && musicVolume > 0) {
        const musicSource = offlineCtx.createBufferSource();
        musicSource.buffer = backgroundMusicBuffer;
        musicSource.loop = outputDuration > backgroundMusicBuffer.duration;
        
        const musicGain = offlineCtx.createGain();
        const startVolume = (musicVolume / 100);
        
        // Initialize music volume
        musicGain.gain.setValueAtTime(startVolume, 0);

        // --- BROADCAST QUALITY OFFLINE AUTO DUCKING ---
        if (autoDucking && sourceBuffer && voiceVolume > 0) {
            const channelData = sourceBuffer.getChannelData(0);
            // Process voice data to find "active" regions
            // We use a windowed RMS approach to detect speech
            const sampleRate = sourceBuffer.sampleRate;
            const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
            const duckLevel = startVolume * 0.15; // Duck down to 15%
            const threshold = 0.02; // Silence threshold
            
            // Time constants for smoothness
            const attackTime = 0.3; // Time to fade music OUT (voice starts)
            const releaseTime = 0.8; // Time to fade music IN (voice ends)
            const holdTime = 0.2; // Keep music low for a bit after speech stops

            let isSpeechActive = false;
            let lastSpeechEndTime = -1.0;

            // Pre-scan buffer to build an "envelope" of speech events
            // This is much better than real-time chunk processing
            for (let i = 0; i < channelData.length; i += windowSize) {
                // Calculate RMS of current window
                let sum = 0;
                const end = Math.min(i + windowSize, channelData.length);
                for (let j = i; j < end; j++) {
                    const sample = channelData[j];
                    sum += sample * sample;
                }
                const rms = Math.sqrt(sum / (end - i));
                
                // Current time in output timeline (add voice delay)
                const now = voiceDelay + (i / sampleRate);

                if (rms > threshold) {
                    if (!isSpeechActive) {
                        // Speech JUST started
                        // Ramp music DOWN before speech starts slightly if possible, or right now
                        const duckStartTime = Math.max(0, now - 0.1); 
                        musicGain.gain.setTargetAtTime(duckLevel, duckStartTime, attackTime / 4); // Quick ramp down
                        isSpeechActive = true;
                    }
                    lastSpeechEndTime = now;
                } else {
                    // Silence
                    if (isSpeechActive) {
                        // Check if silence has persisted long enough to release
                        if (now - lastSpeechEndTime > holdTime) {
                            // Release music UP
                            musicGain.gain.setTargetAtTime(startVolume, now, releaseTime / 3);
                            isSpeechActive = false;
                        }
                    }
                }
            }
            
            // Ensure volume returns to normal at the very end of voice track if still ducked
            const absoluteVoiceEnd = voiceDelay + (sourceBuffer.duration / speed);
            if (isSpeechActive || (absoluteVoiceEnd > lastSpeechEndTime)) {
                 musicGain.gain.setTargetAtTime(startVolume, absoluteVoiceEnd + holdTime, releaseTime / 3);
            }
        }

        // Apply Fade Out at the very end if Trimming
        if (trimToVoice && sourceBuffer) {
            // Fade out the music elegantly at the end of the calculated duration
            // Use outputDuration minus fade duration, ensuring we don't cut into the voice tail
            const safeFadeStart = Math.max(0, outputDuration - FADE_OUT_DURATION);
            
            // Cancel automation to take control
            try { 
                musicGain.gain.cancelScheduledValues(safeFadeStart); 
                // Set value explicitly at fade start to ensure continuity from previous automation
                musicGain.gain.setValueAtTime(musicGain.gain.value, safeFadeStart);
            } catch(e){}
            
            musicGain.gain.linearRampToValueAtTime(0.0001, outputDuration);
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

            const channels = buffer instanceof AudioBuffer ? buffer.numberOfChannels : 1;
            const rate = buffer instanceof AudioBuffer ? buffer.sampleRate : sampleRate;
            
            const mp3encoder = new lamejs.Mp3Encoder(channels, rate, bitrate);

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
                leftData = floatTo16BitPCM(buffer.getChannelData(0));
                if (channels > 1) {
                    rightData = floatTo16BitPCM(buffer.getChannelData(1));
                }
            } else {
                const b = buffer.byteLength % 2 === 0 ? buffer : buffer.subarray(0, buffer.byteLength - 1);
                leftData = new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2);
            }

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
