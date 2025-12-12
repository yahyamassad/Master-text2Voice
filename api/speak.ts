
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

    // --- SYSTEM INSTRUCTION (Persona & Gender) ---
    // Moving instructions here improves stability significantly vs wrapping the user prompt.
    let systemInstruction = "You are a professional voice actor. Read the text naturally and clearly.";
    
    if (selectedVoiceName === 'Puck' || selectedVoiceName === 'Charon' || selectedVoiceName === 'Fenrir') {
        systemInstruction += " You are a MALE speaker. Your voice MUST be deep and masculine. Do NOT speak with a female pitch.";
    } else if (selectedVoiceName === 'Kore' || selectedVoiceName === 'Zephyr') {
        systemInstruction += " You are a FEMALE speaker. Your voice MUST be soft and feminine.";
    }

    systemInstruction += "\nStrict Constraints:\n1. Do NOT read metadata or code.\n2. Do NOT explain the text.\n3. Read exactly what is provided in the detected language.";

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const cleanText = text.trim();
                
                const response = await client.models.generateContent({
                    model: MODEL_NAME,
                    contents: {
                        role: 'user',
                        parts: [{ text: cleanText }] // Send raw text, let model handle it via system instruction
                    },
                    config: {
                        responseModalities: ['AUDIO'],
                        systemInstruction: systemInstruction, // Proper place for instructions
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
                
                // If we get here, the model returned a response but no audio (likely a safety refusal or text output)
                console.warn(`Attempt ${attempt}: API returned no audio data. Response:`, JSON.stringify(response));
                throw new Error("Model refused to generate audio (Safety/Filter).");

            } catch (err: any) {
                const errMsg = err.message || err.toString();
                console.error(`Attempt ${attempt} failed:`, errMsg);

                // Retry on Rate Limits (429/503) AND Internal Errors (500) which happen frequently with Preview models
                const isRetryable = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('busy') || errMsg.includes('quota') || errMsg.includes('500') || errMsg.includes('Internal');

                if (isRetryable) {
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
