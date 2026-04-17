import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, safeEqual } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  const expected = process.env.ADMIN_PASSWORD ?? ''
  if (typeof password !== 'string' || !expected || !safeEqual(password, expected)) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set('admin_session', createSessionToken('admin'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
  })

  return response
}
