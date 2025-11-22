
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    let body = req.body;
    // Safely parse body if it comes as a string (edge case in some environments)
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

        // Increased timeout to 30 seconds to handle cold starts or network latency
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
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            }
        });

        const result: any = await Promise.race([apiPromise, timeoutPromise]);

        // Safely extract text, handling various SDK response shapes
        let translatedText = result.text;
        
        // Fallback extraction if the direct property is missing
        if (!translatedText && result.candidates?.[0]?.content?.parts?.[0]?.text) {
            translatedText = result.candidates[0].content.parts[0].text;
        }
        
        if (!translatedText) {
             if (result.candidates?.[0]?.finishReason) {
                console.warn(`Translation blocked/stopped. Reason: ${result.candidates?.[0]?.finishReason}`);
            }
            throw new Error("Translation returned empty response.");
        }

        // Strip markdown code blocks if present
        let cleanText = translatedText.trim();
        cleanText = cleanText.replace(/^```(json)?/i, '').replace(/```$/, '');

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            translatedText: cleanText,
            speakerMapping: {} 
        });

    } catch (error: any) {
        console.error("Translation Error:", error);
        return res.status(500).json({ error: error.message || 'Translation failed' });
    }
}
