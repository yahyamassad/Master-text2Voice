

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
  
  // Check for specific key first, then generic
  const apiKey = env.SAWTLI_GEMINI_KEY || env.API_KEY;
  
  // Server-side Firebase Admin variables
  const firebaseProject = env.FIREBASE_PROJECT_ID;
  const firebaseEmail = env.FIREBASE_CLIENT_EMAIL;
  const firebaseKey = env.FIREBASE_PRIVATE_KEY;

  // New: Azure Keys
  const azureKey = env.AZURE_SPEECH_KEY;
  const azureRegion = env.AZURE_SPEECH_REGION;

  const responseData: any = {
      configured: false,
      details: {
          gemini: 'Missing',
          firebaseProject: 'Missing',
          firebaseEmail: 'Missing',
          firebaseKey: 'Missing',
          azureKey: 'Missing',
          azureRegion: 'Missing'
      }
  };

  // 1. Check Gemini
  if (apiKey && apiKey.trim() !== '') {
      const last4 = apiKey.length > 4 ? apiKey.slice(-4) : '****';
      const keySource = env.SAWTLI_GEMINI_KEY ? '(SAWTLI_KEY)' : '(API_KEY)';
      
      try {
          // Simple instantiation check
          new GoogleGenAI({ apiKey });
          responseData.details.gemini = `Present ${keySource} ...${last4}`;
          responseData.configured = true; // Minimum requirement
      } catch (e) {
          responseData.details.gemini = `Invalid Format`;
      }
  } else {
      responseData.details.gemini = 'Missing (Check SAWTLI_GEMINI_KEY)';
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

  // 4. Check Firebase Private Key
  if (firebaseKey && firebaseKey.trim().length > 0) {
      const hasBegin = firebaseKey.includes('BEGIN PRIVATE KEY');
      const hasEnd = firebaseKey.includes('END PRIVATE KEY');
      const hasLiteralSlashN = firebaseKey.includes('\\n');
      const hasRealNewline = firebaseKey.includes('\n');
      
      if (!hasBegin || !hasEnd) {
          responseData.details.firebaseKey = `Invalid: Missing Header/Footer`;
      } else if (hasLiteralSlashN && !hasRealNewline) {
          responseData.details.firebaseKey = `Valid (Auto-Fixed)`;
      } else if (hasRealNewline) {
          responseData.details.firebaseKey = `Valid (Multi-line)`;
      } else {
          responseData.details.firebaseKey = `Valid (${firebaseKey.length} chars)`;
      }
  } else {
      responseData.details.firebaseKey = 'Missing (Check FIREBASE_PRIVATE_KEY)';
  }

  // 5. Check Azure Speech Key
  if (azureKey && azureKey.trim().length > 0) {
      const last4 = azureKey.length > 4 ? azureKey.slice(-4) : '****';
      responseData.details.azureKey = `Present ...${last4}`;
  } else {
      responseData.details.azureKey = 'Missing (AZURE_SPEECH_KEY)';
  }

  // 6. Check Azure Region
  if (azureRegion && azureRegion.trim().length > 0) {
      responseData.details.azureRegion = `Present (${azureRegion})`;
  } else {
      responseData.details.azureRegion = 'Missing (AZURE_SPEECH_REGION)';
  }

  return res.status(200).json(responseData);
}
