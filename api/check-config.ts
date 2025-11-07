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
  
  try {
    // This instantiates the client to check if the API key is structurally valid.
    // The constructor throws an error if the key is invalid, which is caught below.
    // By not assigning it to a variable, we avoid the "unused variable" build error.
    new GoogleGenAI({ apiKey });

    return res.status(200).json({ configured: true });

  } catch (error: any) {
    console.error("Config check validation failed:", error);
    return res.status(200).json({ 
        configured: false, 
        message: `API key is present, but validation failed: ${error.message}`
    });
  }
}
