import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken, createSessionToken, safeEqual } from '@/lib/session'

const accessType = process.env.RSVP_ACCESS_TYPE ?? 'none'

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Admin protection
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession || !validateSessionToken(adminSession.value, 'admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // RSVP protection
  if (pathname.startsWith('/rsvp')) {
    if (accessType === 'none') return NextResponse.next()

    // Token mode — if token present in URL, validate and set cookie directly
    if (accessType === 'token') {
      const token = searchParams.get('token')
      if (token) {
        const expected = process.env.RSVP_ACCESS_TOKEN ?? ''
        if (expected && safeEqual(token, expected)) {
          // Valid token — set cookie and redirect to /rsvp without token in URL
          const response = NextResponse.redirect(new URL('/rsvp', request.url))
          response.cookies.set('rsvp_session', createSessionToken('rsvp'), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
          })
          return response
        } else {
          return NextResponse.redirect(new URL('/not-found', request.url))
        }
      }
    }

    // Check for valid session cookie
    const rsvpSession = request.cookies.get('rsvp_session')
    if (!rsvpSession || !validateSessionToken(rsvpSession.value, 'rsvp')) {
      if (accessType === 'password') {
        return NextResponse.redirect(new URL('/rsvp-login', request.url))
      }
      // Token mode with no token and no session
      return NextResponse.redirect(new URL('/not-found', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/((?!login).*)', '/rsvp', '/rsvp/:path*'],
}
