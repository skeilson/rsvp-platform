import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/session'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const resend = new Resend(process.env.RESEND_API_KEY)

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { subject, message, tags } = await request.json()

  if (!subject || !message) {
    return NextResponse.json(
      { error: 'Subject and message are required' },
      { status: 400 }
    )
  }

  if (typeof subject !== 'string' || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Subject and message must be strings' },
      { status: 400 }
    )
  }

  if (subject.length > 200 || message.length > 10_000) {
    return NextResponse.json(
      { error: 'Subject or message too long' },
      { status: 400 }
    )
  }

  // Strip CR/LF from subject to guard against header injection, even
  // though the SDK should handle this.
  const safeSubject = subject.replace(/[\r\n]+/g, ' ').trim()

  try {
    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        guest_tags (
          tags ( name )
        )
      `)
      .not('email', 'is', null)

    if (error || !guests) {
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    const filteredGuests = tags && tags.length > 0
      ? guests.filter(g =>
          g.guest_tags?.some((gt: { tags: { name: string } | { name: string }[] }) => {
            const tagNames = Array.isArray(gt.tags)
              ? gt.tags.map(t => t.name)
              : [gt.tags.name]
            return tagNames.some(name => tags.includes(name))
          })
        )
      : guests
    
    const results = await Promise.allSettled(
      filteredGuests.map(guest =>
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: guest.email!,
          subject: safeSubject,
          html: `
            <p>Hi ${escapeHtml(guest.first_name)},</p>
            <p>${escapeHtml(message)}</p>
          `,
        })
      )
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      sent: succeeded,
      failed,
      total: filteredGuests.length,
    })
  } catch (error) {
    console.error('Email blast error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
