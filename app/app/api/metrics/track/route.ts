import { NextRequest, NextResponse } from 'next/server'
import { rsvpSubmissionCounter, guestLookupCounter } from '@/lib/metrics'

// Per-event label schema with a closed set of allowed values. Anything
// outside the set is dropped so attackers can't inflate Prometheus series
// cardinality by posting arbitrary label values.
const VALID_EVENTS: Record<string, Record<string, Set<string>>> = {
  rsvp_submission: {
    attending: new Set(['yes', 'no']),
  },
  guest_lookup: {
    result: new Set(['found', 'not_found']),
  },
}

export async function POST(request: NextRequest) {
  const { event, labels } = await request.json()

  if (!event || !(event in VALID_EVENTS)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  const schema = VALID_EVENTS[event]
  const filtered: Record<string, string> = {}
  for (const [key, allowed] of Object.entries(schema)) {
    const value = labels?.[key]
    if (typeof value === 'string' && allowed.has(value)) {
      filtered[key] = value
    }
  }

  if (event === 'rsvp_submission') {
    rsvpSubmissionCounter.inc(filtered)
  }

  if (event === 'guest_lookup') {
    guestLookupCounter.inc(filtered)
  }

  return NextResponse.json({ success: true })
}
