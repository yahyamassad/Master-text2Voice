
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
    
    // Improved internal prompt for guaranteed voice generation
    const systemPrompt = `[MODE: TTS_ONLY] Respond strictly with the generated audio for the following text. Do not provide textual analysis or dialogue. If the text is Arabic, use natural, eloquent pronunciation. Text: "${text}"`;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const MAX_RETRIES = 2;
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: [{ parts: [{ text: systemPrompt }] }],
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

                const candidates = response.candidates;
                if (!candidates || candidates.length === 0) throw new Error("No candidates returned");

                const parts = candidates[0].content.parts;
                const audioPart = parts.find(p => p.inlineData);

                if (audioPart?.inlineData?.data) {
                    return res.status(200).json({ audioContent: audioPart.inlineData.data });
                }
                
                throw new Error("Model failed to return audio data. Check safety filters or prompt.");

            } catch (err: any) {
                lastError = err;
                console.warn(`TTS Attempt ${attempt} failed:`, err.message);
                if (err.message?.includes('429') || err.message?.includes('503') || err.message?.includes('audio')) {
                    await delay(attempt * 1200);
                    continue;
                }
                throw err;
            }
        }
        throw lastError;

    } catch (error: any) {
        console.error("Gemini TTS Critical Error:", error);
        return res.status(500).json({ error: error.message || "Service error. Please try again." });
    }
}
