import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { kv } from "@vercel/kv";

/**
 * =============================================
 *  STABLE VOICE ENGINE — "SAWTLI Recovery Build"
 *  By Yahya Massad
 * =============================================
 *
 * الميزات:
 * ✅ ثبات كامل في نبرة الصوت والسرعة
 * ✅ انتظار متسلسل بين المقاطع (Queue)
 * ✅ ذاكرة مؤقتة (Caching) للأصوات المكررة
 * ✅ قابل للتوسعة لمصادر صوت خارجية (مثل ElevenLabs)
 */

const MODEL = process.env.VOICE_MODEL || "gemini-2.5-flash-preview-tts";
const BASE_VOICE = process.env.BASE_VOICE || "ar-XA-Wavenet-C";
const BASE_RATE = parseFloat(process.env.BASE_RATE || "1.05");
const BASE_PITCH = parseFloat(process.env.BASE_PITCH || "-2.0");
const PROVIDER = process.env.VOICE_PROVIDER || "google";

/** Queue to ensure ordered audio generation */
const generationQueue: Promise<void>[] = [];

/** Helper to serialize speech tasks */
async function enqueue(task: () => Promise<void>) {
  const prev = generationQueue[generationQueue.length - 1] || Promise.resolve();
  const next = prev.then(task).catch(console.error);
  generationQueue.push(next);
  await next;
  generationQueue.shift();
}

/** Simple hashing utility */
function makeHash(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** Escape SSML entities */
function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text, voice, emotion, pauseDuration } = req.body as {
    text: string;
    voice?: string;
    emotion?: string;
    pauseDuration?: number;
  };

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Input text cannot be empty." });
  }

  try {
    /** Pick the provider (only Google active for now) */
    if (PROVIDER !== "google") {
      return res
        .status(501)
        .json({ error: `Provider ${PROVIDER} not yet implemented.` });
    }

    /** Check cache */
    const cacheKey = makeHash(text + (voice || BASE_VOICE) + (emotion || ""));
    const cached = await kv.get<string>(cacheKey);
    if (cached) {
      console.log(`🟢 Cache hit for key: ${cacheKey}`);
      return res.status(200).json({ audioContent: cached, cached: true });
    }

    /** Enqueue to prevent overlap */
    await enqueue(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = MODEL;

      const selectedVoice = voice || BASE_VOICE;
      const finalEmotion = emotion && emotion !== "Default" ? emotion : "neutral";

      let processedText = `<speak>${escapeSsml(text)}</speak>`;

      // Inject emotion context safely
      if (finalEmotion !== "neutral") {
        processedText = `<speak>(say in a ${finalEmotion.toLowerCase()} tone) ${escapeSsml(
          text
        )}</speak>`;
      }

      // Handle pauses between paragraphs
      if (pauseDuration && pauseDuration > 0) {
        processedText = processedText.replace(
          /\n\s*\n/g,
          `\n<break time="${pauseDuration.toFixed(1)}s"/>\n`
        );
      }

      const requestPayload = {
        model,
        contents: [{ parts: [{ text: processedText }] }],
        config: {
          responseModalities: ["AUDIO" as const],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
                speakingRate: BASE_RATE,
                pitch: BASE_PITCH,
              },
            },
          },
        },
      };

      const result = await ai.models.generateContent(requestPayload);
      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("Audio generation failed: No audio returned.");
      }

      /** Save to cache */
      await kv.set(cacheKey, base64Audio, { ex: 60 * 60 * 24 * 3 }); // cache 3 days
      console.log(`🟡 Cached new key: ${cacheKey}`);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ audioContent: base64Audio });
    });
  } catch (error: any) {
    console.error("❌ Error in speak-stable:", error);
    let message = "An error occurred during speech generation.";

    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("api key not valid")) message = "Invalid Google API Key.";
    else if (msg.includes("billing")) message = "Google Cloud billing is not enabled.";
    else if (msg.includes("permission")) message = "Google API permission denied.";

    if (!res.headersSent) {
      return res.status(500).json({ error: message });
    }
  }
}
