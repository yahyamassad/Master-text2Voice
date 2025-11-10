import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing required parameters: text, sourceLang, and targetLang are required.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';

        const example = `
Here is an example of a correct translation from English to French:

--- English Source ---
Yazan: Hello world! [laugh]
Lana: How are you today?
--- Correct JSON Output ---
{
  "translatedText": "Yazan: Bonjour le monde ! [laugh]\\nLana: Comment ça va aujourd'hui ?"
}
---

The rules from this example are:
1. The speaker names ("Yazan:", "Lana:") are preserved exactly. THEY ARE NOT TRANSLATED.
2. The dialogue for each speaker is translated accurately.
3. Special tags like "[laugh]" are preserved exactly and are not translated.
4. Line breaks (\\n) are perfectly maintained to separate speakers.
`;

        const prompt = `You are an expert multilingual translator. Your task is to translate the text from ${sourceLang} to ${targetLang}.
You must follow these critical rules:
- Translate ONLY the dialogue spoken by the characters.
- PRESERVE the speaker names (e.g., 'Speaker Name:') and any special sound tags (e.g., '[sigh]', '[laugh]') exactly as they appear in the source text. DO NOT TRANSLATE THEM.
- Maintain the original formatting, including all line breaks. Each speaker's line must remain on its own line.
- Return the result as a single JSON object matching the provided schema. The 'translatedText' field must be a single string containing the full translated script, using '\\n' for line breaks.

${example}

Now, translate the following text from ${sourceLang} to ${targetLang}:

--- Source Text ---
${text}
---
`;

        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.1, // Lower temperature for more deterministic translations
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translatedText: { 
                            type: Type.STRING, 
                            description: "The full translated text, with speaker names and tags preserved, and line breaks represented as \\n." 
                        },
                    },
                    required: ["translatedText"]
                }
            }
        });

        const geminiResponseText = result.text;
        if (!geminiResponseText || geminiResponseText.trim() === '') {
            throw new Error('API returned an empty response.');
        }
        
        // The response is already expected to be a valid JSON string due to responseSchema.
        const parsedResult = JSON.parse(geminiResponseText);
    
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(parsedResult);

    } catch (error: any) {
        console.error("Full error in /api/translate:", JSON.stringify(error, null, 2));

        let errorMessage = error.message || 'An unknown server error occurred.';
        const lowerCaseError = errorMessage.toLowerCase();
        
        if (lowerCaseError.includes('api key not valid')) {
            errorMessage = 'Gemini API Error: The API key provided in Vercel is not valid. Please check the `API_KEY` environment variable.';
        } else if (lowerCaseError.includes('billing')) {
            errorMessage = 'Gemini API Error: Billing is not enabled for the Google Cloud project. Please enable billing.';
        } else if (lowerCaseError.includes('permission_denied') || lowerCaseError.includes('api not enabled')) {
             errorMessage = 'Gemini API Error: The required API is not enabled in your Google Cloud project.';
        }

        return res.status(500).json({ error: errorMessage });
    }
}
