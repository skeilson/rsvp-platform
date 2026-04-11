import { NextResponse } from 'next/server'
import { register } from '@/lib/metrics'

export async function GET() {
  const metrics = await client.register.metrics()
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': client.register.contentType,
    },
  })
}
