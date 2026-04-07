import { NextResponse } from 'next/server'
import client from 'prom-client'

const register = new client.Registry()

client.collectDefaultMetrics({ register })

const httpRequestCounter = new client.Counter({
  name: 'rsvp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
})

const rsvpSubmissionCounter = new client.Counter({
  name: 'rsvp_submissions_total',
  help: 'Total number of RSVP submissions',
  labelNames: ['attending'],
  registers: [register],
})

const guestLookupCounter = new client.Counter({
  name: 'rsvp_guest_lookups_total',
  help: 'Total number of guest lookups',
  labelNames: ['result'],
  registers: [register],
})

export { httpRequestCounter, rsvpSubmissionCounter, guestLookupCounter }

export async function GET() {
  const metrics = await register.metrics()
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  })
}
