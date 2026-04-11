import { NextResponse } from 'next/server'
import { register } from '@/lib/metrics'

export async function GET() {
  try {
    const metrics = await register.metrics()
    console.log('Metrics output length:', metrics.length)
    console.log('Metrics sample:', metrics.substring(0, 200))
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return new NextResponse('Error collecting metrics', { status: 500 })
  }
}
