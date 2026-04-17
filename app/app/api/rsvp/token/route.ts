import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, safeEqual } from '@/lib/session'

// Only allow relative paths on our own origin. `//foo` is rejected because
// browsers treat it as a protocol-relative absolute URL.
function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/rsvp'
  return raw
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get('redirect'))

  const expected = process.env.RSVP_ACCESS_TOKEN ?? ''
  if (typeof token !== 'string' || !expected || !safeEqual(token, expected)) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }

  const response = NextResponse.redirect(
    new URL(redirectTo, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  )

  response.cookies.set('rsvp_session', createSessionToken('rsvp'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
