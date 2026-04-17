import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readGuestClaimsFromRequest } from '@/lib/guest-session'

export async function GET(request: NextRequest) {
  const claims = readGuestClaimsFromRequest(request)
  if (!claims || !claims.groupId) {
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
    .eq('group_id', claims.groupId)
    .order('first_name', { ascending: true })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
