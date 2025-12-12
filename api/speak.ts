
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
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
    
    // --- SMART VOICE VALIDATION ---
    const GEMINI_VALID_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    
    let selectedVoiceName = speakers?.speakerA?.voice || voice || 'Puck';
    
    // Check if selected voice is valid for Gemini. If not, default to Puck.
    if (!GEMINI_VALID_VOICES.includes(selectedVoiceName)) {
        console.warn(`Invalid Gemini Voice: ${selectedVoiceName}. Defaulting to Puck.`);
        selectedVoiceName = 'Puck';
    }

    // --- REMOVED SYSTEM INSTRUCTION ---
    // The "systemInstruction" field can sometimes cause INTERNAL (500) errors on the TTS preview model.
    // The model is multilingual and gender-aware based on the voiceConfig alone.
    // We rely on the voice name (Puck, Kore, etc.) to drive the persona.

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Increased Retries for Stability
        const MAX_RETRIES = 5;
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const cleanText = text.trim();
                
                const response = await client.models.generateContent({
                    model: MODEL_NAME,
                    contents: {
                        role: 'user',
                        parts: [{ text: cleanText }]
                    },
                    config: {
                        responseModalities: ['AUDIO'], 
                        // Removed systemInstruction to prevent 500 crashes
                        // CRITICAL FIX: Disable all safety filters to prevent silent failures on innocent text
                        safetySettings: [
                            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        ],
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
                
                console.warn(`Attempt ${attempt}: API returned no audio data. FinishReason: ${response.candidates?.[0]?.finishReason}`);
                
                if (response.candidates?.[0]?.finishReason === 'SAFETY') {
                    throw new Error("Gemini Safety Block: The model refused to read this text.");
                }

                throw new Error("Model response contained no audio data.");

            } catch (err: any) {
                const errMsg = err.message || err.toString();
                console.error(`Attempt ${attempt} failed:`, errMsg);

                // Stop retrying if it's a Safety Block
                if (errMsg.includes("Safety Block")) {
                    throw err;
                }

                // Retry on Rate Limits (429) OR Internal Errors (500/503)
                const isRetryable = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('500') || errMsg.includes('Internal') || errMsg.includes('busy') || errMsg.includes('quota');

                if (isRetryable) {
                    if (attempt === MAX_RETRIES) throw new Error(`Gemini Service Busy/Error after ${MAX_RETRIES} attempts. Please try again later.`);
                    // Exponential backoff: 1s, 2s, 4s, 8s...
                    await delay(1000 * Math.pow(2, attempt - 1)); 
                    continue;
                }
                throw err;
            }
        }

    } catch (error: any) {
        console.error(`Final Failure with ${MODEL_NAME}:`, error.message);
        return res.status(500).json({ 
            error: error.message || "Generation failed.", 
            details: error.message 
        });
    }
    
    return res.status(500).json({ error: "Unexpected end of function" });
}
