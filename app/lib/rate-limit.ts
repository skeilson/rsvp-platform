// Deploy invariants this module depends on:
//   1. Exactly one trusted proxy sits in front of Next. If zero proxies,
//      X-Forwarded-For is client-controlled and getClientIp returns a
//      forgeable value. If two+ proxies and the last one is internal, all
//      traffic shares one bucket and legit users get locked out.
//   2. The app runs as a single long-lived process (Railway container).
//      Scaling beyond one replica makes each replica its own counter;
//      swap this for Redis/Upstash before horizontally scaling.
const attempts = new Map<string, number[]>()
const MAX_TRACKED_KEYS = 10_000

function prune(windowStart: number) {
  for (const [key, timestamps] of attempts) {
    const kept = timestamps.filter(t => t > windowStart)
    if (kept.length === 0) {
      attempts.delete(key)
    } else if (kept.length !== timestamps.length) {
      attempts.set(key, kept)
    }
  }
}

export function rateLimit(
  key: string,
  windowMs: number,
  maxAttempts: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  if (attempts.size > MAX_TRACKED_KEYS) {
    prune(windowStart)
  }

  const timestamps = (attempts.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= maxAttempts) {
    attempts.set(key, timestamps)
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  attempts.set(key, timestamps)
  return { allowed: true, remaining: maxAttempts - timestamps.length }
}

// The edge proxy appends the real client IP to the right of any
// client-supplied X-Forwarded-For chain. Taking the last entry makes
// the value unforgeable by the client while still honoring the proxy.
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
