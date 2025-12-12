
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

        // STRICT SCRIPT TRANSLATION PROMPT
        const systemInstruction = `You are a professional Dubbing Script Translator.
Your Goal: Translate from ${sourceLang} to ${targetLang} while PRESERVING THE EXACT STRUCTURE AND LINE BREAKS.

INPUT CONTEXT:
The input is a script for a multi-speaker audio engine.
Format: "SpeakerName: Dialogue text" or just "Dialogue text".

CRITICAL RULES:
1. **Line-by-Line Strictness**: The output MUST have the EXACT same number of lines (non-empty and empty) as the input.
2. **Preserve Speaker Names**: If a line starts with "Name:", Translate the name phonetically if needed, but KEEP the format "Name: ...". 
3. **Preserve Empty Lines**: If the input has an empty line for a pause, the output MUST have an empty string "" at that index.
4. **No Merging**: NEVER merge two dialogue lines into one paragraph.
5. **No Explanations**: Return ONLY the JSON object.

OUTPUT FORMAT:
JSON Object with a "lines" array.

Example Input:
Yazan: Hello
[empty line]
Lana: How are you?

Example Output JSON:
{
  "lines": [
    "Yazan: Bonjour",
    "",
    "Lana: Comment ça va ?"
  ]
}`;

        const apiPromise = ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
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

        const cleanJsonStr = rawResponse.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
        let parsedData;
        try {
            parsedData = JSON.parse(cleanJsonStr);
        } catch (e) {
            throw new Error("Invalid JSON structure from translation.");
        }

        let translatedLines = parsedData.lines;
        if (!Array.isArray(translatedLines)) throw new Error("Invalid format received.");

        // Join with newlines to reconstruct the visual text block
        const finalTranslatedText = translatedLines.join('\n');

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
