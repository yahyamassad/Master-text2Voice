
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
            TTS engines are stupid. If they see a vowel (Harakat) at the end of a word before a comma, they pronounce it. YOU MUST KILL THE VOWEL.

            STRICT RULES:
            1. **BEFORE PUNCTUATION (Comma ، . ! ?):** The last letter of the word MUST have a SUKUN (ْ).
            2. **FORBIDDEN ENDINGS:** Never put Damma (ُ), Kasra (ِ), or Fatha (َ) on the last letter before a pause.
            3. **THE SHADDA TRAP:** If a word ends in a Shadda (like الرَّقْمِيّ), DO NOT put a Kasra/Damma/Fatha on it if it's before a comma. Put SHADDA + SUKUN (ّْ).
               - WRONG: الرَّقْمِيِّ، (This sounds like "Raqmiyyi")
               - CORRECT: الرَّقْمِيّْ، (This sounds like "Raqmiy" - Natural pause)
            4. **TA MARBUTA (ة):** At a pause, it must be pronounced as a soft 'Ha'.
               - WRONG: بِالحَيَاةِ،
               - CORRECT: بِالحَيَاةْ، (Sukun on Ta Marbuta)

            REAL EXAMPLES:
            Input: "في عصر المحتوى الرقمي،"
            Output: "فِي عَصْرِ الْمُحْتَوَى الرَّقْمِيّْ،" (Notice Sukun on Ya)

            Input: "تجارب صوتية نابضة بالحياة،"
            Output: "تَجَارِبَ صَوْتِيَّةً نَابِضَةً بِالْحَيَاةْ،"

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
