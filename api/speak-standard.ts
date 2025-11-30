import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput } from "@aws-sdk/client-polly";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize AWS Client outside the handler for connection reuse
// We now check for BOTH naming conventions: SAWTLI_ prefix (custom) OR standard AWS_ prefix
const accessKeyId = process.env.SAWTLI_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.SAWTLI_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.SAWTLI_AWS_REGION || process.env.AWS_REGION || "eu-west-1";

const awsClient = new PollyClient({
    region: region,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || ""
    }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // parsing body
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { text, voiceId } = body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
    }

    // Check if AWS keys are configured (using the resolved variables)
    if (!accessKeyId || !secretAccessKey) {
        console.error("AWS Credentials missing. Checked both SAWTLI_AWS_... and AWS_... variables.");
        return res.status(503).json({ error: 'Standard voice service is not configured (Server Side).' });
    }

    try {
        const params: SynthesizeSpeechCommandInput = {
            Text: text,
            OutputFormat: "mp3",
            VoiceId: voiceId || "Zeina", // Default to Arabic Voice if not specified
            Engine: "standard", // Force Standard engine for cost efficiency
        };

        const command = new SynthesizeSpeechCommand(params);
        const data = await awsClient.send(command);

        if (data.AudioStream) {
            // AWS returns a ReadableStream. We need to convert it to a Buffer to send to the client.
            const byteArray = await data.AudioStream.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            
            // Convert to Base64 to send as JSON
            const base64Audio = buffer.toString('base64');

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ 
                audioContent: base64Audio,
                format: 'mp3',
                engine: 'aws-polly-standard' 
            });
        } else {
            throw new Error("AWS Polly did not return an audio stream.");
        }

    } catch (error: any) {
        console.error("AWS Polly Error:", error);
        return res.status(500).json({ 
            error: "Failed to generate standard speech.",
            details: error.message 
        });
    }
}
