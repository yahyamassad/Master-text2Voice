
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
            console.error("Failed to parse body:", e);
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing parameters (text, sourceLang, targetLang).' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';

        const systemInstruction = `You are a professional translator. Translate user input from ${sourceLang} to ${targetLang}. Output ONLY the translated text.`;

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 30000));
        
        const apiPromise = ai.models.generateContent({
            model: model,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
                // Safety settings removed to prevent build errors
            }
        });

        const result: any = await Promise.race([apiPromise, timeoutPromise]);

        let translatedText = result.text;
        
        if (!translatedText && result.candidates?.[0]?.content?.parts?.[0]?.text) {
            translatedText = result.candidates[0].content.parts[0].text;
        }
        
        if (!translatedText) {
             if (result.candidates?.[0]?.finishReason) {
                console.warn(`Translation blocked/stopped. Reason: ${result.candidates?.[0]?.finishReason}`);
            }
            throw new Error("Translation returned empty response.");
        }

        let cleanText = translatedText.trim();
        cleanText = cleanText.replace(/^```(json)?/i, '').replace(/```$/, '');

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            translatedText: cleanText,
            speakerMapping: {} 
        });

    } catch (error: any) {
        console.error("Translation Error:", error);

        // Handle Quota/Rate Limit Errors Gracefully
        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            return res.status(429).json({ 
                error: "Translation service busy. Please try again later." 
            });
        }

        return res.status(500).json({ error: error.message || 'Translation failed' });
    }
}
