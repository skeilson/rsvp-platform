import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { register } from '@/lib/metrics'

// Bearer-token auth so a Prometheus scraper can pull metrics without a
// cookie. If METRICS_SCRAPE_TOKEN is unset, the endpoint returns 404 —
// there's nothing sensitive leaked by its existence, but refusing to
// serve anything is simpler than a partial gate.
function authorized(request: NextRequest): boolean {
  const expected = process.env.METRICS_SCRAPE_TOKEN
  if (!expected) return false

  const header = request.headers.get('authorization') ?? ''
  const match = /^Bearer (.+)$/i.exec(header)
  if (!match) return false

  const provided = match[1]
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const metrics = await register.metrics()
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  })
}
