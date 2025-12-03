
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
            systemInstruction = `You are a strict Arabic Voiceover Director.
            Your task is to add Diacritics (Tashkeel) to the text so it sounds like a NATIVE NEWS ANCHOR, not a robot.

            !!! CRITICAL RULE: THE LAW OF SILENCE (WAQF) !!!
            1. **NEVER** pronounce the vowel on the last letter of a phrase or sentence.
            2. **FORCE SUKUN (ْ)** on the last letter of ANY word that is followed by punctuation (.,?!،؛:) or a new line.
            3. **FORBIDDEN:** Do NOT put Damma (ُ), Kasra (ِ), Fatha (َ), or Tanween (ًٌٍ) on the last letter before a stop.

            EXAMPLES:
            - Input: "في عصر المحتوى الذي لا يتوقف،"
            - WRONG (School Style): "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفُ،" (Ends with Damma - BAD)
            - CORRECT (Pro Style): "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفْ،" (Ends with Sukun - GOOD)

            - Input: "أهلاً بكم في صوتلي."
            - WRONG: "أَهْلًا بِكُمْ فِي صَوْتْلِي." (Ends with Kasra on Ya? No)
            - CORRECT: "أَهْلًا بِكُمْ فِي صَوْتْلِيْ." (Sukun on Ya)

            - Input: "هذه مدرسة."
            - CORRECT: "هَذِهِ مَدْرَسَهْ." (Ta Marbuta pronounced as Ha with Sukun at stop is preferred, or just Sukun 'ةْ')

            Output ONLY the diacritized text. Do not explain.`;
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
