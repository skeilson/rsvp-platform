import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { subject, message, tags } = await request.json()

  if (!subject || !message) {
    return NextResponse.json(
      { error: 'Subject and message are required' },
      { status: 400 }
    )
  }

  try {
    // Fetch guests matching the selected tags
    let query = supabaseAdmin
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

    const { data: guests, error } = await query

    if (error || !guests) {
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    // Filter by tags if provided
    const filteredGuests = tags && tags.length > 0
      ? guests.filter(g =>
          g.guest_tags?.some((gt: any) =>
            tags.includes(gt.tags.name)
          )
        )
      : guests

    // Send emails
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
