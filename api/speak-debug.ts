import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("--- DEBUG: /api/speak-debug endpoint started ---");

    if (req.method !== 'GET') {
        console.log("DEBUG: Method not allowed.");
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("DEBUG: API_KEY is not set in environment variables.");
            return res.status(500).json({
                step: 'Initialization',
                status: 'Failed',
                error: 'API_KEY environment variable is not set on the server.'
            });
        }
        console.log(`DEBUG: API_KEY found. Length: ${apiKey.length}`);

        const ai = new GoogleGenAI({ apiKey });
        console.log("DEBUG: GoogleGenAI client initialized successfully.");

        const model = "gemini-2.5-flash-preview-tts";
        const promptText = "Hello world. This is a diagnostic test.";
        const voice = "Puck";

        const requestPayload = {
            model,
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                responseModalities: ['AUDIO' as const],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        };

        console.log("DEBUG: Sending request to Gemini with payload:", JSON.stringify(requestPayload, null, 2));

        const result = await ai.models.generateContent(requestPayload);

        console.log("DEBUG: Received response from Gemini:", JSON.stringify(result, null, 2));

        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio) {
            console.log("DEBUG: Audio content found in response.");
            return res.status(200).json({
                step: 'API Call',
                status: 'Success',
                message: 'Successfully received audio content from Gemini API.',
                audioContentLength: base64Audio.length
            });
        } else {
            console.error("DEBUG: API call succeeded but no audio content was returned.");
            return res.status(500).json({
                step: 'Response Parsing',
                status: 'Failed',
                error: 'API call was successful, but the response did not contain audio data.',
                fullResponse: result
            });
        }

    } catch (error: any) {
        console.error("--- DEBUG: CAUGHT ERROR in /api/speak-debug ---");
        // Log the full error object for detailed inspection in Vercel logs
        console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        return res.status(500).json({
            step: 'API Call',
            status: 'Failed',
            error: {
                message: error.message || 'An unknown error occurred.',
                name: error.name,
                stack: error.stack,
                // Include additional potentially useful properties
                details: error.details,
                code: error.code,
            }
        });
    }
}
