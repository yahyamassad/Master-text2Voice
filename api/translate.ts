
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
        // JSON often eats newlines. Plain text instruction is safer for Scripts.
        const systemInstruction = `You are a professional Dubbing Script Translator.
Your Goal: Translate from ${sourceLang} to ${targetLang} while PRESERVING THE EXACT STRUCTURE, LINE BREAKS, AND PAUSES.

INPUT CONTEXT:
The input is a script for a multi-speaker audio engine.
Format: "SpeakerName: Dialogue text" or just "Dialogue text".

CRITICAL RULES:
1. **Line-by-Line Strictness**: The output MUST have the EXACT same number of lines as the input.
2. **Preserve Speaker Names**: DO NOT translate the Speaker Names (e.g. keep "Yazan:", "Lana:", "Andrew:"). Only translate the dialogue after the colon.
3. **Preserve Empty Lines**: If the input has an empty line (pause), you MUST output an empty line.
4. **No Merging**: NEVER merge two lines into one paragraph. Keep them separate.
5. **Output Only**: Return ONLY the translated text. No markdown, no "Here is the translation".

Example Input:
Andrew: Hello there.

Ryan: Hi, how are you?

Example Output:
Andrew: Bonjour.

Ryan: Salut, comment ça va ?`;

        const apiPromise = ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, // Low temperature for structure adherence
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

        // Ensure we explicitly add double newlines if the model returned single newlines for gaps
        // This heuristic checks if lines look like "Name:" and ensures they have spacing if the original had spacing
        // For now, we rely on the Prompt's strictness.

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
