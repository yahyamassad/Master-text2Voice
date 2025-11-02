import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { text, sourceLang, targetLang } = req.body;
        
        if (!text || !sourceLang || !targetLang) {
            return res.status(400).json({ error: 'Missing required parameters: text, sourceLang, and targetLang are required.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';

        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}.
IMPORTANT: You MUST preserve the original formatting exactly, including all line breaks and any empty lines between paragraphs.
Preserve any speaker notations (like 'Speaker A:') and any special sound effect tags (like '[laugh]' or '[sigh]').

Source Text:
---
${text}
---
`;

        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translatedText: { type: Type.STRING },
                        speakerMapping: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    original: { type: Type.STRING },
                                    translated: { type: Type.STRING }
                                },
                                required: ["original", "translated"]
                            }
                        }
                    },
                    required: ["translatedText"]
                }
            }
        });

        const geminiResponseText = result.text;
        if (!geminiResponseText || geminiResponseText.trim() === '') {
            throw new Error('API returned an empty response.');
        }
        
        const parsedResult = JSON.parse(geminiResponseText);
        
        const speakerMappingRecord: Record<string, string> = {};
        if (parsedResult.speakerMapping) {
            for (const mapping of parsedResult.speakerMapping) {
                speakerMappingRecord[mapping.original] = mapping.translated;
            }
        }
    
        const responseData = {
            translatedText: parsedResult.translatedText,
            speakerMapping: speakerMappingRecord
        };

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(responseData);

    } catch (error: any) {
        console.error("Error in /api/translate:", error);
        return res.status(500).json({ error: error.message || 'An unknown server error occurred.' });
    }
}
