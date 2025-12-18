
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing parameters.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-flash-preview';

        const systemInstruction = `You are a professional translator. Translate from ${sourceLang} to ${targetLang}. 
        Keep the formatting exact. If speaker names like "Yazan:" or "Lana:" are present, DO NOT translate them. 
        Output ONLY the translated text.`;

        const result = await ai.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: text }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
            }
        });

        const responseText = result.text || "";
        
        if (!responseText) {
            throw new Error("Empty translation result");
        }

        return res.status(200).json({
            translatedText: responseText.trim(),
            status: 'success'
        });

    } catch (error: any) {
        console.error("Translation API Error:", error);
        return res.status(500).json({ error: error.message || 'Translation failed' });
    }
}
