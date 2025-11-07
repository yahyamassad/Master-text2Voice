import { kv } from '@vercel/kv';
import type { VercelRequest } from '@vercel/node';

const DAILY_CHAR_LIMIT = 5000; // Allow 5,000 characters per IP per day
const DAILY_REQUEST_LIMIT = 50; // Still keep a max request limit as a fallback

/**
 * Gets the IP address from the request.
 * @param req The VercelRequest object.
 * @returns The IP address string or null.
 */
function getIp(req: VercelRequest) {
    // Use 'x-forwarded-for' header from Vercel's proxy, fallback to remoteAddress
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || null;
}


/**
 * Constructs the KV key for rate limiting based on IP and date.
 * @param ip The user's IP address.
 * @returns The key string for KV store.
 */
export function getRateLimitKey(ip: string): { charKey: string; requestKey: string } {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return {
        charKey: `rate-limit:char:${ip}:${today}`,
        requestKey: `rate-limit:req:${ip}:${today}`
    };
}


/**
 * Checks if a request from a given IP has exceeded the daily usage limit.
 * It includes a bypass mechanism for the developer/owner using a secret key.
 * Now tracks both character count and request count.
 *
 * @param req The VercelRequest object.
 * @param charCount The number of characters consumed by this request.
 * @returns A Promise that resolves to an object containing rate limit status and current usage.
 */
export async function checkRateLimit(req: VercelRequest, charCount: number): Promise<{ isRateLimited: boolean; currentUsage: number, limit: number }> {
  // --- Owner Bypass Logic ---
  const bypassToken = req.headers['x-bypass-token'] as string;
  const ownerSecret = process.env.OWNER_SECRET_KEY;

  if (ownerSecret && bypassToken === ownerSecret) {
    return { isRateLimited: false, currentUsage: 0, limit: DAILY_CHAR_LIMIT }; // Not rate limited
  }
  // --- End of Owner Bypass Logic ---

  const ip = getIp(req);

  if (!ip) {
    // Block requests where IP cannot be identified.
    return { isRateLimited: true, currentUsage: DAILY_CHAR_LIMIT, limit: DAILY_CHAR_LIMIT }; 
  }

  const { charKey, requestKey } = getRateLimitKey(ip);

  try {
    // Use a transaction to update both counters atomically
    // This prevents partial updates if one operation fails.
    const [charUsage, requestUsage] = await kv.multi()
      // @ts-ignore - incrby is a valid method on Vercel KV
      .incrby(charKey, charCount)
      // @ts-ignore
      .incr(requestKey)
      .exec();

    // Set expiry on the first request of the day to keep KV clean.
    if (charUsage === charCount) { // If current usage is exactly what we just added
      // @ts-ignore
      await kv.expire(charKey, 86400); // 24 hours
    }
    if (requestUsage === 1) {
      // @ts-ignore
       await kv.expire(requestKey, 86400);
    }
    
    const rateLimited = charUsage > DAILY_CHAR_LIMIT || requestUsage > DAILY_REQUEST_LIMIT;
    return { isRateLimited: rateLimited, currentUsage: charUsage, limit: DAILY_CHAR_LIMIT };

  } catch (error) {
    console.error('Error with Vercel KV during rate limiting:', error);
    // Fail open (allow request) to prevent blocking legitimate users during a KV outage.
    return { isRateLimited: false, currentUsage: 0, limit: DAILY_CHAR_LIMIT };
  }
}
