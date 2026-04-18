import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

// Guest session token format: `g:{guestId}:{groupId}:{timestamp}:{random}:{hmac}`.
// - guestId: the guest the lookup matched
// - groupId: their group_id or the literal "-" if ungrouped
// - timestamp: issue time (ms)
// - random: 16 bytes hex, prevents replay-after-logout of a leaked token
// - hmac: sha256 over the preceding 5 fields
//
// This is deliberately separate from the admin/rsvp sessions in session.ts:
// guest sessions hold PII-scoped claims (which guest/group the browser has
// proven ownership of) and must not be confused with the password- or
// token-gate rsvp_session cookie. 24h TTL so a guest who opens the form and
// comes back the next day doesn't get bounced back to the lookup page; the
// cookie is cleared on submit anyway.
const MAX_AGE_MS = 24 * 60 * 60 * 1000

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

export type GuestClaims = {
  guestId: string
  groupId: string | null
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createGuestToken(claims: GuestClaims): string {
  const timestamp = Date.now().toString()
  const random = randomBytes(16).toString('hex')
  const groupPart = claims.groupId ?? '-'
  const payload = `g:${claims.guestId}:${groupPart}:${timestamp}:${random}`
  return `${payload}:${sign(payload)}`
}

export function readGuestClaims(token: string | undefined): GuestClaims | null {
  if (!token) return null

  const parts = token.split(':')
  if (parts.length !== 6) return null

  const [prefix, guestId, groupId, timestamp, random, providedHmac] = parts
  if (prefix !== 'g') return null
  if (!guestId || !groupId || !timestamp || !random || !providedHmac) return null

  const issuedAt = Number(timestamp)
  if (!Number.isFinite(issuedAt)) return null
  if (Date.now() - issuedAt > MAX_AGE_MS) return null

  const payload = `g:${guestId}:${groupId}:${timestamp}:${random}`
  const expectedHmac = sign(payload)

  if (providedHmac.length !== expectedHmac.length) return null

  try {
    const ok = timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    )
    if (!ok) return null
  } catch {
    return null
  }

  return {
    guestId,
    groupId: groupId === '-' ? null : groupId,
  }
}

export function readGuestClaimsFromRequest(request: NextRequest): GuestClaims | null {
  return readGuestClaims(request.cookies.get('guest_session')?.value)
}

export const GUEST_COOKIE_MAX_AGE_SEC = MAX_AGE_MS / 1000
