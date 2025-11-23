
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
  
  // Server-side Firebase Admin variables
  const firebaseProject = process.env.FIREBASE_PROJECT_ID;
  const firebaseEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebaseKey = process.env.FIREBASE_PRIVATE_KEY;

  const responseData: any = {
      configured: false,
      details: {
          gemini: 'Missing',
          firebaseProject: 'Missing',
          firebaseEmail: 'Missing',
          firebaseKey: 'Missing'
      }
  };

  // Check Gemini
  if (apiKey && apiKey.trim() !== '') {
      const last4 = apiKey.length > 4 ? apiKey.slice(-4) : '****';
      try {
          // Simple instantiation check
          new GoogleGenAI({ apiKey });
          responseData.details.gemini = `Present (Ends in ...${last4})`;
          responseData.configured = true;
      } catch (e) {
          responseData.details.gemini = `Invalid Format`;
      }
  }

  // Check Firebase Details Individually
  if (firebaseProject) {
      responseData.details.firebaseProject = `Present (${firebaseProject})`;
  }
  
  if (firebaseEmail) {
      responseData.details.firebaseEmail = `Present (${firebaseEmail.split('@')[0]}...)`;
  }

  if (firebaseKey) {
      // Check for common formatting issues with the private key
      // It must contain the header/footer and properly formatted newlines
      const hasBegin = firebaseKey.includes('BEGIN PRIVATE KEY');
      const hasEnd = firebaseKey.includes('END PRIVATE KEY');
      
      // Check if it's a one-liner (which is often the issue in Vercel)
      // A valid key has many newlines.
      const hasNewlines = firebaseKey.includes('\n') || firebaseKey.includes('\\n'); 
      
      if (hasBegin && hasEnd) {
          if (hasNewlines) {
               responseData.details.firebaseKey = `Valid Format (${firebaseKey.length} chars)`;
          } else {
               responseData.details.firebaseKey = `Warning: No newlines detected. Ensure 'real' newlines are used.`;
          }
      } else {
          responseData.details.firebaseKey = `Invalid: Missing Header/Footer (Check Copy/Paste)`;
      }
  }

  return res.status(200).json(responseData);
}
