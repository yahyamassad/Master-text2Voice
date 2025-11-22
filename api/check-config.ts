
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

/**
 * A serverless function to verify server-side configuration.
 * Returns status AND masked keys for owner verification.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  const firebaseProject = process.env.VITE_FIREBASE_PROJECT_ID;

  const responseData: any = {
      configured: false,
      details: {
          gemini: 'Missing',
          firebase: 'Missing'
      }
  };

  if (apiKey && apiKey.trim() !== '') {
      const last4 = apiKey.slice(-4);
      responseData.details.gemini = `Present (Ends in ...${last4})`;
      
      // Check validity
      try {
          new GoogleGenAI({ apiKey });
          responseData.configured = true;
      } catch (e) {
          responseData.details.gemini = `Invalid Format`;
      }
  }

  if (firebaseProject) {
      responseData.details.firebase = `Present (${firebaseProject})`;
  }

  return res.status(200).json(responseData);
}
