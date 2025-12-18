
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voice } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required.' });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const MODEL_NAME = 'gemini-2.5-flash-preview-tts';
    
    // تم حذف التعليمات البرمجية الزائدة لضمان استجابة الموديل للنص فقط
    const instruction = text; 

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const MAX_RETRIES = 2;
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: [{ parts: [{ text: instruction }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || 'Puck' } }
                        },
                        safetySettings: [
                            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        ]
                    },
                });

                const parts = response.candidates?.[0]?.content?.parts;
                const audioPart = parts?.find(p => p.inlineData);
                const audioData = audioPart?.inlineData?.data;

                if (audioData) {
                    return res.status(200).json({ audioContent: audioData });
                }
                
                // إذا لم نجد audioData ولكن هناك textPart، فهذا يعني أن الموديل أجاب بنص بدلاً من صوت
                throw new Error("Model generated text instead of audio. Safety filter might be triggered.");

            } catch (err: any) {
                lastError = err;
                if (err.message?.includes('429') || err.message?.includes('503')) {
                    await delay(attempt * 1000);
                    continue;
                }
                throw err;
            }
        }
        throw lastError;

    } catch (error: any) {
        console.error("Gemini TTS Error:", error);
        return res.status(500).json({ error: error.message || "Service busy." });
    }
}
