// This declares the lamejs library loaded from the CDN as a global variable.
declare const lame: any;

/**
 * Decodes a base64 string into a Uint8Array.
 * This is necessary because the audio data from the API is base64 encoded.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that can be played.
 * The browser's native `decodeAudioData` is for file formats like MP3/WAV,
 * not raw PCM streams, so we manually construct the buffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit PCM data to the -1.0 to 1.0 range.
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Creates a WAV file Blob from raw PCM audio data.
 * @param pcmData The raw audio data (16-bit).
 * @param numChannels Number of audio channels.
 * @param sampleRate The sample rate of the audio.
 * @returns A Blob representing the WAV file.
 */
export function createWavBlob(pcmData: Uint8Array, numChannels: number, sampleRate: number): Blob {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < dataSize; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Creates an MP3 file Blob from raw PCM audio data using lamejs.
 * @param pcmData The raw audio data (16-bit).
 * @param numChannels Number of audio channels.
 * @param sampleRate The sample rate of the audio.
 * @returns A Blob representing the MP3 file.
 */
export function createMp3Blob(pcmData: Uint8Array, numChannels: number, sampleRate: number): Blob {
    const pcmDataInt16 = new Int16Array(pcmData.buffer);
    const mp3encoder = new lame.Mp3Encoder(numChannels, sampleRate, 128); // 128 kbps
    const mp3DataChunks: Int8Array[] = [];
    const sampleBlockSize = 1152;

    for (let i = 0; i < pcmDataInt16.length; i += sampleBlockSize) {
        const sampleChunk = pcmDataInt16.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3DataChunks.push(mp3buf);
        }
    }
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3DataChunks.push(mp3buf);
    }
    
    return new Blob(mp3DataChunks, { type: 'audio/mpeg' });
}

/**
 * Generates a Uint8Array representing silent audio for a given duration.
 * @param duration Duration of silence in seconds.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels Number of audio channels.
 * @returns A Uint8Array filled with zeros representing silence.
 */
export function generateSilence(duration: number, sampleRate: number, numChannels: number): Uint8Array {
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8; // Should be 2
  const numFrames = Math.floor(duration * sampleRate);
  const bufferSize = numFrames * numChannels * bytesPerSample;
  return new Uint8Array(bufferSize); // An array of zeros is silence in PCM
}

/**
 * Concatenates multiple Uint8Array into a single Uint8Array.
 * @param arrays An array of Uint8Arrays to concatenate.
 * @returns A single Uint8Array containing all the data from the input arrays.
 */
export function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
