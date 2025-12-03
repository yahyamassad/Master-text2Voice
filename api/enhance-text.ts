

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
            systemInstruction = `You are an expert Arabic Voiceover Linguist. Your task is to apply "Functional Diacritics" (Tashkeel) optimized for natural-sounding Text-to-Speech (TTS).

            !!! THE GOLDEN RULES OF NATURAL SPEECH (WAQF) !!!
            
            1. **STRICT SILENCE AT ENDS (WAQF):**
               - ANY word at the end of a sentence, phrase, or followed by punctuation (.,?!،؛) MUST end with a **SUKUN (ْ)**.
               - NEVER put a vowel (Damma, Kasra, Fatha, Tanween) on the last letter before a pause.
               - Example: "فِي الْعَصْرِ الْحَدِيثِ" (Wrong/Robotic) -> "فِي الْعَصْرِ الْحَدِيثْ" (Correct/Natural).

            2. **THE SHADDA EXCEPTION:**
               - If the last letter has a Shadda (like الرَّقْمِيّ), end it with **SHADDA + SUKUN (ّْ)**. 
               - NEVER put Kasra under Shadda at the end (e.g., الرَّقْمِيِّ is FORBIDDEN at a pause).

            3. **TA MARBUTA (ة):**
               - At a pause, pronounce as 'Ha' with Sukun (هْ) or (ةْ). Do NOT put a vowel.

            4. **MINIMALIST INTERIOR:**
               - Only diacritize the ends of words (Grammar/I'rab) and letters crucial for meaning. 
               - Avoid over-diacritizing every single letter inside long words unless necessary for ambiguity.

            EXAMPLES:
            - Input: "Sawtli هو الحل الشامل الذي يضع نهاية لهذه التحديات"
            - Output: "Sawtli هُوَ الْحَلُّ الشَّامِلُ الَّذِي يَضَعُ نِهَايَةً لِهَذِهِ التَّحَدِّيَاتْ" (Notice the Sukun at end)

            - Input: "في عصر المحتوى الرقمي،"
            - Output: "فِي عَصْرِ الْمُحْتَوَى الرَّقْمِيّْ،" (Shadda + Sukun)

            - Input: "تجارب صوتية نابضة بالحياة"
            - Output: "تَجَارِبَ صَوْتِيَّةً نَابِضَةً بِالْحَيَاةْ"

            - Input: "نحن نعيد تعريف التواصل."
            - Output: "نَحْنُ نُعِيدُ تَعْرِيفَ التَّوَاصُلْ."

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
