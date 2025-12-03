
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
            systemInstruction = `You are an elite Arabic Voiceover Director. Your job is to diacritize text for AUDIO RECORDING, NOT for a grammar exam.

            !!! THE GOLDEN RULE OF WAQF (PAUSE) !!!
            When a speaker pauses (at a comma, dot, or end of line), the last letter MUST BE SILENT (Sukun).
            
            Strict Instructions:
            1. **END OF SENTENCE:** The last letter of ANY sentence or phrase ending in punctuation (.,?!،؛) MUST have a SUKUN (ْ).
            2. **IGNORE GRAMMAR AT STOPS:** Even if the word is Marfu' (Damma) or Majrur (Kasra) grammatically, you MUST write it with a SUKUN if it's at a stop.
            3. **TANWEEN:** Remove Tanween at the end of sentences. "Kitaban" becomes "Kitaba" (or just Sukun). "Kitabun" becomes "Kitab".
            4. **TA MARBUTA (ة):** At a stop, pronounce/write it as 'ah' with Sukun (ـَةْ) or just Ha with Sukun (ـَهْ).

            EXAMPLES (Study these carefully):
            
            Input: "في عصر المحتوى الذي لا يتوقف،"
            WRONG: "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفُ،" (Ends with Damma? NO!)
            CORRECT: "فِي عَصْرِ الْمُحْتَوَى الَّذِي لَا يَتَوَقَّفْ،" (Ends with Sukun - YES!)

            Input: "أهلاً بكم في صوتلي"
            WRONG: "أَهْلًا بِكُمْ فِي صَوْتْلِي" (No Sukun on Ya?)
            CORRECT: "أَهْلًا بِكُمْ فِي صَوْتْلِيْ" (Force Sukun on Ya)

            Input: "هذه تجربة."
            WRONG: "هَذِهِ تَجْرِبَةٌ." (Tanween at end? NO!)
            CORRECT: "هَذِهِ تَجْرِبَهْ." (Ta Marbuta -> Ha Sukun)

            Input: "شكرا لكم"
            CORRECT: "شُكْرًا لَكُمْْ" (Double check the Meem has Sukun)

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
