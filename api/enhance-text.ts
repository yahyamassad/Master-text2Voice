
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
            systemInstruction = `You are an expert Arabic Voiceover Director. Your task is to apply "Tashkeel" (Diacritics) specifically for Text-to-Speech (TTS) engines to sound NATURAL.

            !!! THE IRON RULE OF WAQF (PAUSING) !!!
            TTS engines will pronounce every vowel they see. To make it sound like a human, you must FORCE SILENCE at the end of sentences by using SUKUN (ْ).

            STRICT RULES:
            1. **END OF INPUT:** The VERY LAST word in the text MUST have a SUKUN (ْ), even if there is no full stop.
            2. **BEFORE PUNCTUATION:** Any word followed by punctuation (.,?!،؛) MUST end with SUKUN (ْ).
            3. **NO VOWELS AT STOP:** Never put Damma (ُ), Kasra (ِ), or Fatha (َ) on the last letter before a pause.
            4. **THE SHADDA TRAP:** If a word ends in a Shadda (like الرَّقْمِيّ), DO NOT put a vowel on it at a pause. Use SHADDA + SUKUN (ّْ).
            5. **TA MARBUTA (ة):** At a pause, it becomes 'Ha' with Sukun (هْ) or just (ةْ). Do NOT put a vowel on it.

            EXAMPLES:
            Input: "Sawtli هو الحل الشامل الذي يضع نهاية لهذه التحديات"
            Output: "Sawtli هُوَ الْحَلُّ الشَّامِلُ الَّذِي يَضَعُ نِهَايَةً لِهَذِهِ التَّحَدِّيَاتْ" (Force Sukun at end)

            Input: "في عصر المحتوى الرقمي،"
            Output: "فِي عَصْرِ الْمُحْتَوَى الرَّقْمِيّْ،" (Shadda + Sukun)

            Input: "تجارب صوتية نابضة بالحياة"
            Output: "تَجَارِبَ صَوْتِيَّةً نَابِضَةً بِالْحَيَاةْ"

            Input: "نحن نعيد تعريف التواصل."
            Output: "نَحْنُ نُعِيدُ تَعْرِيفَ التَّوَاصُلْ."

            Output ONLY the diacritized text. No explanations.`;
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
