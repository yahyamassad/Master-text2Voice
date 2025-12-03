
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, type } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    try {
        const apiKey = process.env.SAWTLI_GEMINI_KEY || process.env.API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const model = 'gemini-2.5-flash';

        let systemInstruction = "";
        
        if (type === 'tashkeel') {
            systemInstruction = `You are an expert Arabic linguist. Your task is to add full diacritics (Tashkeel) to the following Arabic text to ensure perfect pronunciation for Text-to-Speech engines.
            Rules:
            1. Add Fatha, Damma, Kasra, Sukun, Shadda, and Tanween exactly where needed.
            2. Do NOT change any words or vocabulary.
            3. Do NOT add any introductory or concluding remarks.
            4. Output ONLY the diacritized text.
            5. If the text is not Arabic, return it exactly as is.`;
        } else {
            return res.status(400).json({ error: 'Invalid enhancement type' });
        }

        const result = await ai.models.generateContent({
            model: model,
            contents: { role: 'user', parts: [{ text: text }] },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, // Low temperature for precision
            }
        });

        let enhancedText = result.text;
        
        // Cleanup if model adds markdown
        if (enhancedText) {
            enhancedText = enhancedText.replace(/^```(json|text)?/i, '').replace(/```$/, '').trim();
        }

        if (!enhancedText) throw new Error("Empty response from AI");

        return res.status(200).json({ enhancedText });

    } catch (error: any) {
        console.error("Text Enhancement Error:", error);
        return res.status(500).json({ error: error.message || 'Enhancement failed' });
    }
}
