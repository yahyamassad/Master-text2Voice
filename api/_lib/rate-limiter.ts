import type { VercelRequest, VercelResponse } from '@vercel/node';

// NOTE: This is a simple in-memory rate limiter. In a serverless environment,
// each function invocation is stateless, so this will only limit rapid-fire
// requests that hit the same warm instance. For production-grade rate limiting,
// a distributed datastore like Vercel KV (Redis) is recommended.
const requestTimestamps = new Map<string, number[]>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Allow 30 API calls per minute per IP

/**
 * Applies a simple IP-based rate limit.
 * Throws an error if the rate limit is exceeded.
 * @param req The Vercel request object.
 * @param res The Vercel response object (unused, but kept for signature consistency).
 */
export async function applyRateLimiting(req: VercelRequest, res: VercelResponse): Promise<void> {
    // Identify the user by their IP address.
    // 'x-forwarded-for' is the standard header for identifying the originating IP address.
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',').shift()?.trim() || req.socket?.remoteAddress;

    if (!ip) {
        // Can't apply rate limiting without an IP. For now, we'll allow these requests.
        return;
    }

    const now = Date.now();
    const userTimestamps = requestTimestamps.get(ip) || [];

    // Filter out timestamps that are outside the current window.
    const recentTimestamps = userTimestamps.filter(
        (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
        // If the user has made too many requests, throw an error.
        throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    // Add the current request's timestamp and update the store.
    recentTimestamps.push(now);
    requestTimestamps.set(ip, recentTimestamps);
}