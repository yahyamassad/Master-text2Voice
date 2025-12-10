
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
            console.error("Failed to parse body:", e);
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, voice, speakers } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    const apiKey = process.env.SAWTLI_GEMINI_KEY || process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server Error: API Key is missing.' });
    }

    const client = new GoogleGenAI({ apiKey });
    const MODEL_NAME = process.env.GEMINI_MODEL_TTS || 'gemini-2.5-flash-preview-tts';
    const selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';

    // --- GENDER ENFORCEMENT ---
    // User reported Puck and Charon drifting to female voices.
    // We add explicit instructions to the prompt to lock the gender persona.
    let genderInstruction = "";
    if (selectedVoiceName === 'Puck' || selectedVoiceName === 'Charon' || selectedVoiceName === 'Fenrir') {
        genderInstruction = "Identity: You are a MALE speaker with a deep, resonant voice. Do NOT speak with a high pitch or female tone.";
    } else if (selectedVoiceName === 'Kore' || selectedVoiceName === 'Zephyr') {
        genderInstruction = "Identity: You are a FEMALE speaker.";
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // STRICT System Instruction to prevent hallucination
                const cleanText = text.trim();
                
                // Enhanced protection prompt against code reading/hallucinations AND gender drift
                const protectedPrompt = `
Task: Read the following text aloud exactly as written.
${genderInstruction}
Strict Constraints:
1. Do NOT read any technical metadata, code snippets, or introductory phrases.
2. Do NOT explain the text.
3. Do NOT switch to English if the text is Arabic.
4. Only vocalize the content inside the triple quotes below.

Text to read:
"""
${cleanText}
"""
`;
                
                const response = await client.models.generateContent({
                    model: MODEL_NAME,
                    contents: {
                        role: 'user',
                        parts: [{ text: protectedPrompt }]
                    },
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoiceName } }
                        }
                    },
                });

                const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (audioData) {
                    res.setHeader('Content-Type', 'application/json');
                    return res.status(200).json({ audioContent: audioData, modelUsed: MODEL_NAME });
                }
                
                throw new Error("API returned no audio data.");

            } catch (err: any) {
                const errMsg = err.message || err.toString();
                const isRateLimit = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('busy') || errMsg.includes('quota');

                if (isRateLimit) {
                    if (attempt === MAX_RETRIES) throw err;
                    await delay(1000 * attempt); 
                    continue;
                }
                throw err;
            }
        }

    } catch (error: any) {
        console.error(`Final Failure with ${MODEL_NAME}:`, error.message);
        return res.status(500).json({ 
            error: "Generation failed.", 
            details: error.message 
        });
    }
    
    return res.status(500).json({ error: "Unexpected end of function" });
}
