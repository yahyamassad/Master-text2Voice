import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

/**
 * A serverless function to verify that the necessary server-side configuration (API_KEY) is present and valid.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(200).json({ 
      configured: false, 
      message: 'The API_KEY environment variable is not set or is empty in Vercel.' 
    });
  }
  
  try {
    // Attempting to instantiate the client will throw an error for a malformed key.
    // This is a good first-pass validation before making an actual API call.
    new GoogleGenAI({ apiKey: apiKey });
    
    // If we reach here, the key format is syntactically valid.
    return res.status(200).json({ configured: true });

  } catch (error: any) {
      let errorMessage = 'An unknown error occurred during API key validation.';
      if (error && error.message) {
          // Extract a cleaner error message if available
          const match = error.message.match(/\[GoogleGenerativeAI Error\]:\s*(.*)/);
          errorMessage = match ? match[1] : error.message;
      }
      
      console.error("Config check validation failed:", errorMessage);
      
      return res.status(200).json({ 
          configured: false, 
          message: `API key validation failed: ${errorMessage}`
      });
  }
}
