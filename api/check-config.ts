
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

  const env = process.env;
  
  const apiKey = env.API_KEY;
  
  // Server-side Firebase Admin variables
  const firebaseProject = env.FIREBASE_PROJECT_ID;
  const firebaseEmail = env.FIREBASE_CLIENT_EMAIL;
  const firebaseKey = env.FIREBASE_PRIVATE_KEY;

  const responseData: any = {
      configured: false,
      details: {
          gemini: 'Missing',
          firebaseProject: 'Missing',
          firebaseEmail: 'Missing',
          firebaseKey: 'Missing'
      }
  };

  // 1. Check Gemini
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
  } else {
      responseData.details.gemini = 'Missing (Check API_KEY)';
  }

  // 2. Check Firebase Project ID
  if (firebaseProject && firebaseProject.trim().length > 0) {
      responseData.details.firebaseProject = `Present (${firebaseProject})`;
  } else {
      responseData.details.firebaseProject = 'Missing (Check FIREBASE_PROJECT_ID)';
  }
  
  // 3. Check Firebase Email
  if (firebaseEmail && firebaseEmail.trim().length > 0) {
      const emailParts = firebaseEmail.split('@');
      const maskedEmail = emailParts.length > 1 ? `${emailParts[0].substring(0, 3)}...@${emailParts[1]}` : 'Invalid Format';
      responseData.details.firebaseEmail = `Present (${maskedEmail})`;
  } else {
      responseData.details.firebaseEmail = 'Missing (Check FIREBASE_CLIENT_EMAIL)';
  }

  // 4. Check Firebase Private Key (The most common point of failure)
  if (firebaseKey && firebaseKey.trim().length > 0) {
      // Check for common formatting issues
      const hasBegin = firebaseKey.includes('BEGIN PRIVATE KEY');
      const hasEnd = firebaseKey.includes('END PRIVATE KEY');
      
      // CRITICAL: Vercel env vars sometimes strip newlines if not pasted correctly.
      // We check for literal newline characters OR escaped newline strings which are common.
      const hasRealNewlines = firebaseKey.includes('\n');
      const hasEscapedNewlines = firebaseKey.includes('\\n');
      
      if (!hasBegin || !hasEnd) {
          responseData.details.firebaseKey = `Invalid: Missing Header/Footer`;
      } else if (!hasRealNewlines && !hasEscapedNewlines) {
          responseData.details.firebaseKey = `Invalid: single long line (missing newlines)`;
      } else {
          // It looks okay
          responseData.details.firebaseKey = `Valid Format (${firebaseKey.length} chars)`;
      }
  } else {
      responseData.details.firebaseKey = 'Missing (Check FIREBASE_PRIVATE_KEY)';
  }

  // Return 200 even if config is missing so the frontend can display the debug info
  return res.status(200).json(responseData);
}
