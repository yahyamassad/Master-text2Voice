
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body = req.body;
    // Safely parse body if it comes as a string
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error("Failed to parse body:", e);
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, voice } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    // Default fallback voice
    const safeVoice = voice || 'Puck';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        // Simplest possible config structure
        const speechConfig = {
            voiceConfig: { 
                prebuiltVoiceConfig: { 
                    voiceName: safeVoice 
                } 
            },
        };

        // Increased timeout to 30 seconds
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TTS Request timed out')), 30000));

        const apiPromise = ai.models.generateContent({
            model,
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                responseModalities: ['AUDIO'], 
                speechConfig: speechConfig,
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            },
        });

        const result: any = await Promise.race([apiPromise, timeoutPromise]);
        
        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const reason = result.candidates?.[0]?.finishReason || 'Unknown';
            console.error("Model finished without audio. Reason:", reason, JSON.stringify(result, null, 2));
            throw new Error(`Model finished without audio. Reason: ${reason}`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: any) {
        console.error("Speech Generation Error:", error);
        return res.status(500).json({ error: error.message || "Speech generation failed." });
    }
}
