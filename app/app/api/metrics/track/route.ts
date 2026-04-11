import { NextRequest, NextResponse } from 'next/server'
import { rsvpSubmissionCounter, guestLookupCounter } from '@/lib/metrics'

export async function POST(request: NextRequest) {
  const { event, labels } = await request.json()

  if (event === 'rsvp_submission') {
    rsvpSubmissionCounter.inc(labels)
  }

  if (event === 'guest_lookup') {
    guestLookupCounter.inc(labels)
  }

  return NextResponse.json({ success: true })
}
