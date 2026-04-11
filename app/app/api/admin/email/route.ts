import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
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
          g.guest_tags?.some((gt: any) =>
            tags.includes(gt.tags.name)
          )
        )
      : guests

    const results = await Promise.allSettled(
      filteredGuests.map(guest =>
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: guest.email!,
          subject,
          html: `
            <p>Hi ${guest.first_name},</p>
            <p>${message}</p>
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
