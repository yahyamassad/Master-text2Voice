import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

/**
 * A helper function to validate the API key by attempting to instantiate the GenAI client.
 * This isolates the validation logic and ensures there are no unused variables.
 * @param key The API key string to validate.
 * @returns An object indicating if the key is valid and an error message if it's not.
 */
function validateApiKey(key: string): { valid: boolean; error: string | null } {
    try {
        new GoogleGenAI({ apiKey: key });
        return { valid: true, error: null };
    } catch (error: any) {
        return { valid: false, error: error.message };
    }
}

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
  
  const validation = validateApiKey(apiKey);
  
  if (validation.valid) {
      return res.status(200).json({ configured: true });
  } else {
      console.error("Config check validation failed:", validation.error);
      return res.status(200).json({ 
          configured: false, 
          message: `API key is present, but validation failed: ${validation.error}`
      });
  }
}
