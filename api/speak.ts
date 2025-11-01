import { GoogleGenAI, Modality } from "@google/genai";

// --- START: Utility functions required by the backend ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- END: Utility functions ---

interface SpeakerConfig {
    name: string;
    voice: string;
}
type SpeechSpeed = number;

// Server-side AI client initialization
function getAiClient(): GoogleGenAI {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is not configured on the server.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

// Vercel Serverless Function handler for all speech generation
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }
  
  try {
    const { text, voice, speed, emotion, speakers, isPreview } = request.body;
    if (!text || !voice) {
      return response.status(400).json({ message: 'Missing required fields' });
    }

    const client = getAiClient();
    let speechConfig: any;

    // Configure for multi-speaker or single-speaker
    if (!isPreview && speakers && speakers.speakerA?.name?.trim() && speakers.speakerB?.name?.trim()) {
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    {
                        speaker: speakers.speakerA.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } }
                    },
                    {
                        speaker: speakers.speakerB.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } }
                    }
                ]
            }
        };
    } else {
        // Default to single speaker for previews or if multi-speaker config is incomplete
        speechConfig = {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
        };
    }
    
    let promptText = text;

    if (!isPreview) {
        // Add instructions for emotion and speed to the prompt for non-preview generation
        let instructionPrefix = '';
        const emotionMap: { [key: string]: string } = {
            'Happy': 'Say cheerfully:',
            'Sad': 'Read in a sad tone:',
            'Formal': 'Read in a formal, professional voice:',
        };
        if (emotion !== 'Default' && emotionMap[emotion]) {
            instructionPrefix = emotionMap[emotion];
        }

        let speedInstruction = '';
        if (speed < 0.8) speedInstruction = 'Read very slowly:';
        else if (speed < 1.0) speedInstruction = 'Read slowly:';
        else if (speed > 1.2) speedInstruction = 'Read very quickly:';
        else if (speed > 1.0) speedInstruction = 'Read quickly:';
        
        if (instructionPrefix && speedInstruction) {
            instructionPrefix = `${instructionPrefix.slice(0, -1)} and ${speedInstruction.toLowerCase()}`;
        } else {
            instructionPrefix = instructionPrefix || speedInstruction;
        }
        
        if (instructionPrefix) {
            promptText = `${instructionPrefix}\n${text}`;
        }
    }

    // Make the single API call to Gemini
    const geminiResponse = await client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig,
        },
    });

    const base64Audio = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
        // The API already returns base64, so we can pass it directly.
        return response.status(200).json({ audioContent: base64Audio });
    } else {
        return response.status(500).json({ message: 'Failed to generate audio content from API' });
    }

  } catch (error) {
    console.error('Error in /api/speak:', error.response?.data || error.message);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
