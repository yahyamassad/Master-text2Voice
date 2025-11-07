import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(200).json({ 
      configured: false, 
      message: 'The API_KEY environment variable is not set in Vercel.' 
    });
  }
  
  // The presence of the key is the most important check for the owner.
  // A subsequent API call failing due to billing is a separate, diagnosable issue.
  // This check is enough to hide the setup overlay for the owner.
  try {
    // Optional: Make a lightweight, non-billing call to further validate the key if needed.
    // For now, just checking existence is sufficient.
    const ai = new GoogleGenAI({ apiKey });
    // A quick check like listing models could be used, but might incur minor costs.
    // For simplicity, we assume if the key exists, it's configured.
    // If API calls fail later, the enhanced error messages in speak/translate will guide the user.

    return res.status(200).json({ configured: true });

  } catch (error: any) {
    console.error("Config check validation failed:", error);
    return res.status(200).json({ 
        configured: false, 
        message: `API key is present, but validation failed: ${error.message}`
    });
  }
}