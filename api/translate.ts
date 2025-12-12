
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
        const apiKey = process.env.SAWTLI_GEMINI_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const MODEL_NAME = process.env.GEMINI_MODEL_TEXT || 'gemini-2.5-flash';

        // STRICT SCRIPT TRANSLATION PROMPT (PLAIN TEXT MODE)
        const systemInstruction = `You are a professional Dubbing Script Translator.
Your Goal: Translate from ${sourceLang} to ${targetLang} while PRESERVING THE EXACT STRUCTURE.

CRITICAL FORMATTING RULES:
1. **Double Newline**: You MUST output TWO empty lines (\\n\\n) between every speaker or paragraph to ensure clear visual separation.
2. **Preserve Speaker Names**: DO NOT translate names (keep "Andrew:", "Yazan:", "Ryan:"). Only translate the dialogue.
3. **Format**: "Name: Translated Text".
4. **No Merging**: Never merge two lines.

Example Input:
Andrew: Hello.
Ryan: Hi.

Example Output:
Andrew: Bonjour.

Ryan: Salut.`;

        const apiPromise = ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, 
            }
        });

        // 30s Timeout
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 30000));
        const result: any = await Promise.race([apiPromise, timeoutPromise]);

        let rawResponse = result.text;
        if (!rawResponse && result.candidates?.[0]?.content?.parts?.[0]?.text) {
            rawResponse = result.candidates[0].content.parts[0].text;
        }
        
        if (!rawResponse) throw new Error("Translation returned empty response.");

        // Cleanup markdown if present
        let finalTranslatedText = rawResponse.replace(/^```(json|text)?/i, '').replace(/```$/, '').trim();

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            translatedText: finalTranslatedText,
            speakerMapping: {} 
        });

    } catch (error: any) {
        console.error("Translation Error:", error);
        return res.status(500).json({ error: error.message || 'Translation failed' });
    }
}
