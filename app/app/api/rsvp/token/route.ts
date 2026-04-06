import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {

  const token = request.nextUrl.searchParams.get('token')
  const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/rsvp'

  if (token !== process.env.RSVP_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }

  const response = NextResponse.redirect(
    new URL(redirectTo, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  )

  response.cookies.set('rsvp_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
