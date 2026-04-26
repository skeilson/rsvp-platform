import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/session'

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

    // Check for valid session cookie
    const rsvpSession = request.cookies.get('rsvp_session')
    if (rsvpSession && validateSessionToken(rsvpSession.value, 'rsvp')) {
      return NextResponse.next()
    }

    // Allow through if token present in URL — client-side will validate it
    if (accessType === 'token' && searchParams.get('token')) {
      return NextResponse.next()
    }

    if (accessType === 'password') {
      return NextResponse.redirect(new URL('/rsvp-login', request.url))
    }

    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/((?!login).*)', '/rsvp', '/rsvp/:path*'],
}
