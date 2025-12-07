
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
            // UPDATED PROMPT: Relaxed Waqf rules to support Poetry/Rhyme better
            systemInstruction = `You are an expert Arabic Voiceover Linguist. Apply "Functional Diacritics" (Tashkeel) optimized for natural, eloquent Text-to-Speech (TTS).

            CRITICAL RULES FOR ENDINGS (RHYME & FLOW):
            
            1. **POETRY & RHYME AWARENESS:** 
               - If the text looks like poetry or rhymed prose (Saja'), preserve the vowel on the rhyme letter if it adds musicality. 
               - Do NOT force Sukun (ْ) at the end of every sentence if it breaks the flow or rhyme.
               - If the word is indefinite (Tanween), pronounce it if it fits the meter/flow.

            2. **PROSE & STOPS:**
               - For standard sentences (News, Narration), you MAY use Sukun at full stops (.) for a natural pause, BUT if the sentence continues (comma, or connected thought), use the correct grammatical vowel (I'rab) to link the words.

            3. **SHADDA:**
               - Always preserve Shadda.

            4. **ACCURACY:**
               - Ensure full grammatical accuracy (I'rab) for all internal words.

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
