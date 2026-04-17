import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

const THEME_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('theme')
    .select('*')
    .eq('id', THEME_ID)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()

  const { data, error } = await supabase
    .from('theme')
    .update({
      primary_color: body.primary_color,
      background_color: body.background_color,
      accent_color: body.accent_color,
      font_family: body.font_family,
      logo_url: body.logo_url || null,
      hero_url: body.hero_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', THEME_ID)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to save theme' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
