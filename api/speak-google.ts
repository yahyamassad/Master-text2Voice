
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

// Robust Private Key Cleaner
// Handles:
// 1. Surrounding double quotes (common Vercel copy-paste error)
// 2. Escaped newlines (\\n) -> Real newlines (\n)
// 3. Trimming whitespace
const getCleanPrivateKey = (key: string | undefined) => {
    if (!key) return undefined;
    
    let cleanKey = key.trim();
    
    // Remove surrounding quotes if they exist (start AND end)
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
        cleanKey = cleanKey.slice(1, -1);
    }
    
    // Replace literal \n with actual newlines
    cleanKey = cleanKey.replace(/\\n/g, '\n');
    
    return cleanKey;
};

// Initialize the Google Cloud TTS Client using the SAME credentials as Firebase Admin.
// This simplifies config significantly - one service account rules them all.
const client = new TextToSpeechClient({
    credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: getCleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
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

    const { text, ssml, voiceId, languageCode } = body;

    if (!text && !ssml) {
        return res.status(400).json({ error: 'Text or SSML is required.' });
    }

    // Check if Credentials are configured
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error("Google Cloud Credentials missing (FIREBASE vars).");
        return res.status(503).json({ error: 'Studio voice service is not configured (Server Side).' });
    }

    try {
        // Default voice if none specified
        const selectedVoice = voiceId || "ar-XA-Wavenet-B";
        
        // INTELLIGENT LANGUAGE FORCE
        // Google Cloud TTS is strict. "en-US-Studio-Q" MUST use "en-US". Sending "en" fails.
        // We override whatever the frontend sends if we can derive the specific locale from the ID.
        let selectedLang = 'ar-XA'; // Fallback

        const parts = selectedVoice.split('-');
        if (parts.length >= 2) {
            // e.g. "en-US-Studio-Q" -> parts[0]="en", parts[1]="US" -> "en-US"
            // e.g. "cmn-CN-Wavenet-A" -> parts[0]="cmn", parts[1]="CN" -> "cmn-CN"
            selectedLang = `${parts[0]}-${parts[1]}`;
        } else if (languageCode) {
            // Only use the frontend hint if we can't figure it out from the voice name
            selectedLang = languageCode;
        }

        // Prepare Input: Check if SSML is provided, otherwise use Text
        const inputParams = ssml ? { ssml: ssml } : { text: text };

        const [response] = await client.synthesizeSpeech({
            input: inputParams,
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
        return res.status(500).json({ 
            error: "Failed to generate studio speech.",
            details: error.message || error.toString(),
            voiceAttempted: voiceId,
            projectId: process.env.FIREBASE_PROJECT_ID // Return the ID being used to help debug mismatches
        });
    }
}
