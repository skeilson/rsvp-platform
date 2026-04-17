import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

type SessionType = 'admin' | 'rsvp'

const MAX_AGE_MS: Record<SessionType, number> = {
  admin: 60 * 60 * 24 * 1000, // 24h — matches admin cookie maxAge
  rsvp: 60 * 60 * 24 * 7 * 1000, // 7d — matches rsvp cookie maxAge
}

// Per-process dev fallback secret. Regenerated on every boot, so dev
// sessions invalidate on restart — intentional, and better than reusing
// ADMIN_PASSWORD as the HMAC key (which would entangle the password and
// signing secret, and leak one if the other leaks).
const devFallbackSecret = randomBytes(32).toString('hex')

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 32) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is required in production and must be at least 32 characters.'
    )
  }
  return devFallbackSecret
}

export function createSessionToken(type: SessionType): string {
  const timestamp = Date.now().toString()
  const random = randomBytes(16).toString('hex')
  const payload = `${type}:${timestamp}:${random}`
  const hmac = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}:${hmac}`
}

export function validateSessionToken(token: string, expectedType: SessionType): boolean {
  const parts = token.split(':')
  if (parts.length !== 4) return false

  const [type, timestamp, random, providedHmac] = parts
  if (type !== expectedType) return false
  if (!timestamp || !random || !providedHmac) return false

  const issuedAt = Number(timestamp)
  if (!Number.isFinite(issuedAt)) return false
  if (Date.now() - issuedAt > MAX_AGE_MS[expectedType]) return false

  const payload = `${type}:${timestamp}:${random}`
  const expectedHmac = createHmac('sha256', getSecret()).update(payload).digest('hex')

  if (providedHmac.length !== expectedHmac.length) return false

  try {
    return timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    )
  } catch {
    return false
  }
}

export function requireAdmin(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get('admin_session')
  if (!cookie || !validateSessionToken(cookie.value, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

// Constant-time comparison for string passwords/tokens of any length.
export function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    // Run the compare anyway against aBuf to keep timing closer to equal-length case.
    timingSafeEqual(aBuf, aBuf)
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}
