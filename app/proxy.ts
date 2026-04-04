import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session')

  if (!adminSession || adminSession.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/((?!login).*)'],
}
