import { GoogleGenAI, Modality } from "@google/genai";

// Fix: Per coding guidelines, the API key must be sourced from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type SpeechSpeed = 'slow' | 'normal' | 'fast';


export async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional comments, formatting, or explanations:\n\n"${text}"`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text.trim();

    } catch (error) {
        console.error("Error translating text with Gemini API:", error);
        throw new Error("GEMINI_API_ERROR");
    }
}


export async function generateSpeech(text: string, voice: 'Puck' | 'Kore', speed: SpeechSpeed, languageName: string): Promise<string | null> {
    try {
        let speedInstruction = '';
        switch (speed) {
            case 'slow':
                speedInstruction = 'Read it at a pace that is slightly slower than normal conversation.';
                break;
            case 'fast':
                speedInstruction = 'Read it at a pace that is slightly faster than normal conversation.';
                break;
            case 'normal':
            default:
                speedInstruction = 'Read it at a normal conversational pace.';
                break;
        }

        const prompt = `Read the following text in ${languageName}. ${speedInstruction} Ensure you use an interrogative intonation for questions and mark brief pauses between sentences to make the speech sound natural. The text is: "${text}"`;


        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
            return base64Audio;
        } else {
            console.error("No audio data in API response:", response);
            return null;
        }

    } catch (error) {
        console.error("Error generating speech with Gemini API:", error);
        throw new Error("GEMINI_API_ERROR");
    }
}