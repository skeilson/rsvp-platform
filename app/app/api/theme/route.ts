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

const VALID_HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const ALLOWED_FONTS = [
  'Inter',
  'Playfair Display',
  'Lato',
  'Montserrat',
  'Raleway',
  'Merriweather',
]

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json()

  const errors: string[] = []

  if (body.primary_color && !VALID_HEX_COLOR.test(body.primary_color)) {
    errors.push('primary_color must be a valid hex color (e.g. #ff0000)')
  }
  if (body.background_color && !VALID_HEX_COLOR.test(body.background_color)) {
    errors.push('background_color must be a valid hex color')
  }
  if (body.accent_color && !VALID_HEX_COLOR.test(body.accent_color)) {
    errors.push('accent_color must be a valid hex color')
  }
  if (body.font_family && !ALLOWED_FONTS.includes(body.font_family)) {
    errors.push(`font_family must be one of: ${ALLOWED_FONTS.join(', ')}`)
  }
  if (body.logo_url && !isValidUrl(body.logo_url)) {
    errors.push('logo_url must be a valid HTTPS URL')
  }
  if (body.hero_url && !isValidUrl(body.hero_url)) {
    errors.push('hero_url must be a valid HTTPS URL')
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

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
