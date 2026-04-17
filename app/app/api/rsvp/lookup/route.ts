import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createGuestToken, GUEST_COOKIE_MAX_AGE_SEC } from '@/lib/guest-session'
import { requireRsvpAccess } from '@/lib/rsvp-access'
import { config } from '@/lib/config'

type LookupResult =
  | { kind: 'solo'; redirectTo: string }
  | { kind: 'group'; redirectTo: string }
  | { kind: 'responded'; redirectTo: string }
  | { kind: 'not_found' }

export async function POST(request: NextRequest) {
  const denied = requireRsvpAccess(request)
  if (denied) return denied

  const { firstName, lastName } = await request.json()

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    !firstName.trim() ||
    !lastName.trim() ||
    firstName.length > 100 ||
    lastName.length > 100
  ) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('guests')
    .select('id, group_id, has_responded')
    .ilike('first_name', firstName.trim())
    .ilike('last_name', lastName.trim())
    .maybeSingle()

  if (error || !data) {
    const body: LookupResult = { kind: 'not_found' }
    return NextResponse.json(body, { status: 404 })
  }

  let result: LookupResult
  if (data.has_responded && !config.rsvp.allowChanges) {
    result = { kind: 'responded', redirectTo: '/rsvp/responded' }
  } else if (data.group_id) {
    result = { kind: 'group', redirectTo: `/rsvp/group/${data.group_id}` }
  } else {
    result = { kind: 'solo', redirectTo: `/rsvp/solo/${data.id}` }
  }

  const response = NextResponse.json(result)
  response.cookies.set(
    'guest_session',
    createGuestToken({ guestId: data.id, groupId: data.group_id ?? null }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: GUEST_COOKIE_MAX_AGE_SEC,
      path: '/',
    }
  )
  return response
}
