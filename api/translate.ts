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
        // Log the full error structure for debugging in Vercel logs
        console.error("Full error in /api/translate:", JSON.stringify(error, null, 2));

        // Construct a more detailed error message for the frontend
        let errorMessage = 'An unknown server error occurred.';
        if (error.message) {
            errorMessage = error.message;
        }

        // Check for common, user-fixable issues in the message from Google's API
        const lowerCaseError = errorMessage.toLowerCase();
        if (lowerCaseError.includes('api key not valid')) {
            errorMessage = 'Gemini API Error: The API key provided in Vercel is not valid. Please check the `API_KEY` environment variable.';
        } else if (lowerCaseError.includes('billing') || lowerCaseError.includes('project has not enabled billing')) {
            errorMessage = 'Gemini API Error: Billing is not enabled for the Google Cloud project associated with the API key. Please enable billing to use this feature.';
        } else if (lowerCaseError.includes('permission_denied') || lowerCaseError.includes('api not enabled')) {
             errorMessage = 'Gemini API Error: The "Generative Language API" or "Vertex AI API" is not enabled in your Google Cloud project. Please visit your Google Cloud Console and enable it.';
        } else if (lowerCaseError.includes('not found')) {
            errorMessage = `Gemini API Error: The requested resource was not found. This can sometimes indicate an issue with the API key's project association.`;
        }

        return res.status(500).json({ error: errorMessage });
    }
}