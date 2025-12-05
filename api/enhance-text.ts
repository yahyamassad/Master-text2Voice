
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
            // STRICT WAQF RULES TO FIX "INDIAN ACCENT" TTS EFFECT
            systemInstruction = `You are an expert Arabic Voiceover Linguist. Your task is to apply "Functional Diacritics" (Tashkeel) optimized for natural-sounding Text-to-Speech (TTS).

            !!! CRITICAL RULE: PAUSE PRONUNCIATION (WAQF) !!!
            
            1. **FORCED SILENCE (SUKUN) AT STOPS:**
               - Every word at the end of a sentence (.), phrase, or followed by a comma (،) MUST end with a **SUKUN (ْ)**.
               - **FORBIDDEN:** Do NOT use Damma (ُ), Kasra (ِ), Fatha (َ), or Tanween at the end of a phrase.
               - Example: "السَّلَامُ عَلَيْكُمْ." -> "السَّلَامُ عَلَيْكُمْ." (Correct, meem usually sakin)
               - Example: "فِي الْمَدِينَةِ،" -> "فِي الْمَدِينَةْ،" (Ta Marbuta becomes Ha Sakin)
               - Example: "الْكِتَابُ جَدِيدٌ." -> "الْكِتَابُ جَدِيدْ." (Strict Sukun)

            2. **SHADDA AT STOPS:**
               - If a word ends with a Shadda letter (like حُبّ or حَقّ), maintain the Shadda but add Sukun: (ّْ).
               - Example: "الْحَقُّ" -> "الْحَقّْ"

            3. **TA MARBUTA (ة):**
               - At a stop/comma, pronounce as 'Ha' with Sukun (هْ). 
               - Do NOT write vowels on ة at the end of a sentence.

            4. **INTERNAL VOWELS:**
               - Add full vowels for internal words to ensure correct grammar (I'rab), but keep the last letter of the *utterance* silent (Sukun).

            EXAMPLES:
            - Input: "أهلا بك في صوتلي. نحن هنا للمساعدة."
            - Output: "أَهْلًا بِكَ فِي صَوْتْلِي. نَحْنُ هُنَا لِلْمُسَاعَدَةْ." (Note: صَوْتْلِي ends naturally, للمساعدة becomes Ha Sakin)

            - Input: "في يوم من الأيام، كان هناك رجل حكيم."
            - Output: "فِي يَوْمٍ مِنَ الْأَيَّامْ، كَانَ هُنَاكَ رَجُلٌ حَكِيمْ." (Note: Ayam and Hakeem end with Sukun)

            Output ONLY the diacritized text. No markdown, no explanations.`;
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
