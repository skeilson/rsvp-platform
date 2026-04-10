import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register })

export const rsvpSubmissionCounter = new client.Counter({
  name: 'rsvp_submissions_total',
  help: 'Total number of RSVP submissions',
  labelNames: ['attending'],
  registers: [register],
})

export const guestLookupCounter = new client.Counter({
  name: 'rsvp_guest_lookups_total',
  help: 'Total number of guest lookups',
  labelNames: ['result'],
  registers: [register],
})

export async function pushMetrics() {
  const grafanaUrl = process.env.GRAFANA_PROMETHEUS_URL
  const grafanaUser = process.env.GRAFANA_PROMETHEUS_USER
  const grafanaToken = process.env.GRAFANA_PROMETHEUS_TOKEN

  if (!grafanaUrl || !grafanaUser || !grafanaToken) {
    console.log('Missing Grafana credentials — skipping push')
    return
  }

  try {
    const metrics = await client.register.metrics()
    const credentials = Buffer.from(`${grafanaUser}:${grafanaToken}`).toString('base64')

    const response = await fetch(`${grafanaUrl}/api/prom/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Authorization': `Basic ${credentials}`,
      },
      body: metrics,
    })

    console.log('Grafana push response status:', response.status)
    const body = await response.text()
    console.log('Grafana push response body:', body)
  } catch (error) {
    console.error('Grafana push error:', error)
  }
}
