/**
 * Minimal in-memory per-IP rate limiter for the public lead-submission route.
 *
 * This resets whenever the serverless function instance is recycled and does
 * not share state across instances/regions — it is a basic deterrent against
 * naive scripted spam, not a hard guarantee. For stronger protection at
 * scale, swap this for a shared store (e.g. Upstash Redis / Vercel KV).
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [key, value] of hits) {
      if (value.every((t) => now - t > WINDOW_MS)) hits.delete(key);
    }
  }

  return false;
}
