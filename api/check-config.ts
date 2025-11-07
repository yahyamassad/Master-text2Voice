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
    // This is a cheap, synchronous check for a syntactically valid key format.
    // The constructor will throw an error if the key is malformed (e.g., contains invalid characters).
    new GoogleGenAI({ apiKey });
    
    // If we reach here, the key format is syntactically valid.
    return res.status(200).json({ configured: true });

  } catch (error: any) {
      console.error("API key validation failed during instantiation:", error);
      
      // If the constructor throws, the key is likely malformed. Return a static, safe message
      // to avoid sending a complex error object that could break client-side JSON parsing.
      return res.status(200).json({ 
          configured: false, 
          message: 'API key validation failed: The key appears to be malformed or invalid.'
      });
  }
}
