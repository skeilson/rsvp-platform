import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await request.formData()
  const file = formData.get('file') as File
  const folder = formData.get('folder') as string ?? 'general'

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  const fileExt = file.name.split('.').pop()
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
