
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

    // Default fallback voice
    const safeVoice = voice || 'Puck';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-preview-tts";
        
        let speechConfig: any = {};

        if (speakers) {
            speechConfig.multiSpeakerVoiceConfig = {
                speakerVoiceConfigs: [
                    {
                        speaker: speakers.speakerA.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerA.voice } }
                    },
                    {
                        speaker: speakers.speakerB.name,
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: speakers.speakerB.voice } }
                    }
                ]
            };
        } else {
            speechConfig.voiceConfig = { 
                prebuiltVoiceConfig: { 
                    voiceName: safeVoice 
                } 
            };
        }

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
                // Safety settings removed to prevent build errors (defaults are sufficient)
            },
        });

        const result: any = await Promise.race([apiPromise, timeoutPromise]);
        
        const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!base64Audio) {
            const reason = result.candidates?.[0]?.finishReason || 'Unknown';
            console.error("Model finished without audio. Reason:", reason);
            throw new Error(`Model finished without audio. Reason: ${reason}`);
        }

        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ audioContent: base64Audio });
        
    } catch (error: any) {
        console.error("Speech Generation Error:", error);
        
        // Graceful handling for Quota/Rate Limit Errors
        // This prevents showing raw JSON to the user
        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            return res.status(429).json({ 
                error: "Server capacity reached or busy. Please try again later." 
            });
        }

        return res.status(500).json({ error: error.message || "Speech generation failed." });
    }
}
