import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/session'

// Mirrors the access-type gate in proxy.ts, but at the API layer.
// proxy.ts only guards page paths — /api/rsvp/* is unreachable through it.
// When access mode is password or token, every guest-flow API route must
// independently check that the caller has an rsvp_session cookie first.
export function requireRsvpAccess(request: NextRequest): NextResponse | null {
  const accessType = process.env.RSVP_ACCESS_TYPE ?? 'none'
  if (accessType === 'none') return null

  const session = request.cookies.get('rsvp_session')
  if (!session || !validateSessionToken(session.value, 'rsvp')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
