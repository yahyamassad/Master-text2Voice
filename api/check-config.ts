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

  // STABILITY FIX: Explicitly check for a missing or empty API key.
  if (!apiKey || apiKey.trim() === '') {
    return res.status(200).json({ 
      configured: false, 
      message: 'The API_KEY environment variable is not set or is empty in Vercel.' 
    });
  }
  
  // STABILITY FIX: Wrap the client instantiation in a top-level try/catch block
  // to ensure any error is caught and formatted into a valid JSON response,
  // preventing malformed stream responses that cause client-side parsing errors.
  try {
    // The act of instantiating the client can throw an error if the key format is syntactically wrong.
    new GoogleGenAI({ apiKey: apiKey });
    
    // If instantiation succeeds, the key format is valid.
    // We can't fully validate permissions without making a call, but this is a crucial first step.
    return res.status(200).json({ configured: true });

  } catch (error: any) {
      let errorMessage = 'An unknown error occurred during API key validation.';
      if (error && error.message) {
          errorMessage = error.message;
      }
      
      console.error("Config check validation failed:", errorMessage);

      // Provide more user-friendly error messages for common issues.
      const lowerCaseError = errorMessage.toLowerCase();
      if (lowerCaseError.includes('api key not valid')) {
          errorMessage = 'Gemini API Error: The API key provided in Vercel has an invalid format. Please check the `API_KEY` environment variable.';
      }
      
      return res.status(200).json({ 
          configured: false, 
          message: `API key validation failed: ${errorMessage}`
      });
  }
}
