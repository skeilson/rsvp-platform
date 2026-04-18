import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

// SVG intentionally excluded: it can carry inline <script> and event
// handlers, which become stored XSS if the URL is ever embedded outside
// of an <img> element. Re-enable only after sanitizing through DOMPurify.
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])
const ALLOWED_FOLDERS = new Set(['general', 'logo', 'hero', 'theme'])
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const SAFE_EXT = /^[a-z0-9]{1,8}$/i

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await request.formData()
  const file = formData.get('file') as File
  const folderRaw = (formData.get('folder') as string) ?? 'general'
  const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : 'general'

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File too large' },
      { status: 413 }
    )
  }

  const rawExt = file.name.split('.').pop() ?? ''
  const fileExt = SAFE_EXT.test(rawExt) ? rawExt.toLowerCase() : 'bin'
  const fileName = `${folder}/${Date.now()}.${fileExt}`

  const { data, error } = await supabaseAdmin.storage
    .from('rsvp-assets')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    })

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('rsvp-assets')
    .getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl })
}
