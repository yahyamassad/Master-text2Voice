
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, voice } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const MODEL_NAME = 'gemini-2.5-flash-preview-tts';
    
    // Improved Prompt for better Arabic/French Prosody
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const enhancedPrompt = isArabic 
        ? `[Perform with natural Arabic emotions and clear articulation]: ${text}`
        : `[Perform with natural prosody and clear articulation]: ${text}`;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Exponential Backoff Retry Logic for "Server Busy" or "Rate Limit"
        const MAX_RETRIES = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: MODEL_NAME,
                    contents: enhancedPrompt,
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

                const audioData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

                if (audioData) {
                    return res.status(200).json({ audioContent: audioData });
                }
                
                throw new Error("Empty audio response from Gemini.");

            } catch (err: any) {
                lastError = err;
                const errMsg = err.message || "";
                // If 429 (Rate Limit) or 503 (Service Unavailable/Busy), wait and retry
                if (errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('500')) {
                    const waitTime = attempt * 2000; // 2s, 4s, 6s...
                    await delay(waitTime);
                    continue;
                }
                throw err; // For safety blocks or other errors, don't retry
            }
        }
        throw lastError || new Error("Failed after retries.");

    } catch (error: any) {
        console.error("Gemini TTS Error:", error);
        return res.status(500).json({ 
            error: error.message?.includes('503') ? "Google Servers are currently overloaded. Retrying..." : error.message 
        });
    }
}
