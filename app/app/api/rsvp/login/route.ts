import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { createSessionToken, safeEqual } from '@/lib/session'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { allowed } = rateLimit(`rsvp-login:${ip}`, WINDOW_MS, MAX_ATTEMPTS)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const { password } = await request.json()
  const expected = process.env.RSVP_ACCESS_PASSWORD ?? ''

  if (typeof password !== 'string' || !expected || !safeEqual(password, expected)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('rsvp_session', createSessionToken('rsvp'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
