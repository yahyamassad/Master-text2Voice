
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
        
        // Configurable Model Name for Stability
        const MODEL_NAME = process.env.GEMINI_MODEL_TEXT || 'gemini-2.5-flash';

        // STRICT FORMATTING INSTRUCTION
        // We explicitly tell the model that this is a script/dialogue and formatting is critical.
        const systemInstruction = `You are a professional translator specializing in script and dialogue translation. 
Translate the user input from ${sourceLang} to ${targetLang}.

CRITICAL FORMATTING RULES (MUST FOLLOW):
1. **PRESERVE LINE BREAKS**: Do NOT merge lines. If the source text has a newline, the translated text MUST have a newline at the exact same position.
2. **DIALOGUE STRUCTURE**: If a line follows the format "Name: Text", preserve this structure in the translation (e.g., "TranslatedName: TranslatedText"). Do not remove the colon (:).
3. **EMPTY LINES**: Keep empty lines exactly as they are (used for pauses).
4. **NO MARKDOWN**: Output plain text only. Do not wrap in markdown code blocks.

Example Input:
John: Hello
[newline]
Jane: Hi there

Example Output:
جون: مرحباً
[newline]
جين: أهلاً بك`;

        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 30000));
        
        const apiPromise = ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, // Low temperature to reduce "creativity" in layout
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
        // Remove markdown code blocks if the model ignored instructions
        cleanText = cleanText.replace(/^```(json|text)?/i, '').replace(/```$/, '');

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            translatedText: cleanText,
            speakerMapping: {} 
        });

    } catch (error: any) {
        console.error("Translation Error:", error);

        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            return res.status(429).json({ 
                error: "Translation service busy. Please try again later." 
            });
        }

        return res.status(500).json({ error: error.message || 'Translation failed' });
    }
}
