import { NextResponse } from 'next/server'
import { register, esvpSubmissionCounter, guestLookupCounter } from '@/lib/metrics'

export { rsvpSubmissionCounter, guestLookupCounter }

export async function GET() {
  const { register } = await import('@/lib/metrics')
  const client = await import('prom-client')
  const metrics = await client.default.register.metrics()
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': client.default.register.contentType,
    },
  })
}
