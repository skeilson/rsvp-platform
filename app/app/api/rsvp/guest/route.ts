import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readGuestClaimsFromRequest } from '@/lib/guest-session'

export async function GET(request: NextRequest) {
  const claims = readGuestClaimsFromRequest(request)
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('guests')
    .select(`
      id,
      first_name,
      last_name,
      email,
      guest_tags ( tags ( name ) )
    `)
    .eq('id', claims.guestId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
