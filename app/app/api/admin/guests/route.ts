import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

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
      has_responded,
      responses (
        id,
        attending,
        dietary,
        song_request,
        note,
        submitted_at
      ),
      guest_tags (
        tags ( name )
      ),
      custom_answers (
        question_id,
        answer
      ),
      event_responses (
        id,
        event_id,
        attending,
        answers
      )
    `)
    .order('last_name', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
