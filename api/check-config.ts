
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
  } else {
      responseData.details.firebaseProject = 'Missing (Check FIREBASE_PROJECT_ID)';
  }
  
  if (firebaseEmail) {
      const emailParts = firebaseEmail.split('@');
      const maskedEmail = emailParts.length > 1 ? `${emailParts[0].substring(0, 3)}...@${emailParts[1]}` : 'Invalid Format';
      responseData.details.firebaseEmail = `Present (${maskedEmail})`;
  } else {
      responseData.details.firebaseEmail = 'Missing (Check FIREBASE_CLIENT_EMAIL)';
  }

  if (firebaseKey) {
      // Check for common formatting issues with the private key
      const hasBegin = firebaseKey.includes('BEGIN PRIVATE KEY');
      
      // CRITICAL: Vercel env vars sometimes strip newlines if not pasted correctly.
      // We check for literal newline characters or escaped newlines.
      const hasRealNewlines = firebaseKey.includes('\n');
      const hasEscapedNewlines = firebaseKey.includes('\\n');
      
      if (!hasBegin) {
          responseData.details.firebaseKey = `Invalid: Missing Header (-----BEGIN PRIVATE KEY-----)`;
      } else if (!hasRealNewlines && !hasEscapedNewlines) {
          responseData.details.firebaseKey = `Invalid: Key is one long line. Needs newlines.`;
      } else {
          responseData.details.firebaseKey = `Valid Format (${firebaseKey.length} chars)`;
      }
  } else {
      responseData.details.firebaseKey = 'Missing (Check FIREBASE_PRIVATE_KEY)';
  }

  return res.status(200).json(responseData);
}
