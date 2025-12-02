
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

// Initialize the Google Cloud TTS Client using the SAME credentials as Firebase Admin.
// This simplifies config significantly - one service account rules them all.
const client = new TextToSpeechClient({
    credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        project_id: process.env.FIREBASE_PROJECT_ID,
    }
});

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

    const { text, voiceId, languageCode } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    // Check if Credentials are configured
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error("Google Cloud Credentials missing (FIREBASE vars).");
        return res.status(503).json({ error: 'Studio voice service is not configured (Server Side).' });
    }

    try {
        // Default voice if none specified
        const selectedVoice = voiceId || "ar-XA-Wavenet-B";
        
        // INTELLIGENT LANGUAGE DETECTION
        // If languageCode is not provided, try to extract it from the voiceId.
        // e.g., "en-US-Journey-D" -> "en-US", "ar-XA-Wavenet-A" -> "ar-XA"
        let selectedLang = languageCode;
        
        if (!selectedLang) {
            const parts = selectedVoice.split('-');
            if (parts.length >= 2) {
                // Combine the first two parts to form the locale (e.g., "en" + "US" = "en-US")
                selectedLang = `${parts[0]}-${parts[1]}`;
            } else {
                selectedLang = "ar-XA"; // Fallback default
            }
        }

        const [response] = await client.synthesizeSpeech({
            input: { text: text },
            voice: { 
                languageCode: selectedLang, 
                name: selectedVoice,
            },
            audioConfig: { 
                audioEncoding: 'MP3',
                speakingRate: 1.0,
                pitch: 0
            },
        });

        if (response.audioContent) {
            // Convert Uint8Array or string to Base64
            let base64Audio = '';
            if (typeof response.audioContent === 'string') {
                base64Audio = response.audioContent;
            } else {
                base64Audio = Buffer.from(response.audioContent).toString('base64');
            }

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ 
                audioContent: base64Audio,
                format: 'mp3',
                engine: 'google-cloud-tts',
                voiceUsed: selectedVoice,
                langUsed: selectedLang
            });
        } else {
            throw new Error("Google Cloud TTS did not return audio content.");
        }

    } catch (error: any) {
        console.error("Google Cloud TTS Error:", error);
        
        // Return the specific error message from Google to aid debugging
        // e.g. "Voice 'X' does not exist" or "Cloud Text-to-Speech API is not enabled"
        return res.status(500).json({ 
            error: "Failed to generate studio speech.",
            details: error.message || error.toString(),
            voiceAttempted: voiceId,
            projectId: process.env.FIREBASE_PROJECT_ID // Return the ID being used to help debug mismatches
        });
    }
}
