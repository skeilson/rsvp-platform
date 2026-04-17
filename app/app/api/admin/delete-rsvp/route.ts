import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { responseId, guestId } = await request.json()

  if (!guestId || typeof guestId !== 'string') {
    return NextResponse.json(
      { error: 'guestId is required' },
      { status: 400 }
    )
  }

  if (responseId) {
    await supabaseAdmin.from('responses').delete().eq('id', responseId)
  }
  await supabaseAdmin.from('event_responses').delete().eq('guest_id', guestId)
  await supabaseAdmin.from('custom_answers').delete().eq('guest_id', guestId)
  await supabaseAdmin
    .from('guests')
    .update({ has_responded: false })
    .eq('id', guestId)

  return NextResponse.json({ success: true })
}
