
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
            systemInstruction = `You are an expert Arabic Voiceover Director and Linguist.
            Your task is to add Diacritics (Tashkeel) to the text specifically for Text-to-Speech (TTS) engines to sound like a professional news anchor.

            CRITICAL RULES FOR NATURAL SPEECH (QAWA'ID AL-WAQF):
            1. **Middle of Sentence:** Add full diacritics to words inside the sentence.
            2. **END OF SENTENCE/PHRASE (THE MOST IMPORTANT RULE):**
               - Any word immediately followed by punctuation (.,?!،؛) MUST end with a **SUKUN (ْ)**.
               - NEVER put a vowel (Damma ُ, Kasra ِ, Fatha َ) on the last letter before a pause.
               - Example Input: "في عصر المحتوى الذي لا يتوقف،"
               - WRONG Output: "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفُ،" (Ends with Damma)
               - CORRECT Output: "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفْ،" (Ends with Sukun)
            3. **Ta Marbuta (ة):** At the end of a phrase/sentence, it must be pronounced as 'Ha' with Sukun (هْ). Do NOT put Tanween on it if it's the last word.
            4. **Tanween:** Do NOT use Tanween (ً ٍ ٌ) on the last word of a sentence, unless it is Tanween Fath (alif) which is sometimes acceptable, but Sukun is preferred for safety.

            Output ONLY the diacritized text without any explanation.`;
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
