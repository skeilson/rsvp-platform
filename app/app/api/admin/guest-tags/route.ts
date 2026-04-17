import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function validIds(body: { guestId?: unknown; tagId?: unknown }): { guestId: string; tagId: string } | null {
  if (typeof body.guestId !== 'string' || typeof body.tagId !== 'string') return null
  if (!body.guestId || !body.tagId) return null
  return { guestId: body.guestId, tagId: body.tagId }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const ids = validIds(await request.json())
  if (!ids) {
    return NextResponse.json(
      { error: 'guestId and tagId are required' },
      { status: 400 }
    )
  }

  await getAdminClient()
    .from('guest_tags')
    .upsert({ guest_id: ids.guestId, tag_id: ids.tagId }, { onConflict: 'guest_id,tag_id' })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const ids = validIds(await request.json())
  if (!ids) {
    return NextResponse.json(
      { error: 'guestId and tagId are required' },
      { status: 400 }
    )
  }

  await getAdminClient()
    .from('guest_tags')
    .delete()
    .eq('guest_id', ids.guestId)
    .eq('tag_id', ids.tagId)

  return NextResponse.json({ success: true })
}
