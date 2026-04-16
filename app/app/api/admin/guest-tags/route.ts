import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { guestId, tagId } = await request.json()

  await supabaseAdmin
    .from('guest_tags')
    .upsert({ guest_id: guestId, tag_id: tagId }, { onConflict: 'guest_id,tag_id' })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { guestId, tagId } = await request.json()

  await supabaseAdmin
    .from('guest_tags')
    .delete()
    .eq('guest_id', guestId)
    .eq('tag_id', tagId)

  return NextResponse.json({ success: true })
}
