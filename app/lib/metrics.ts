import client from 'prom-client'

client.collectDefaultMetrics()

export const rsvpSubmissionCounter = new client.Counter({
  name: 'rsvp_submissions_total',
  help: 'Total number of RSVP submissions',
  labelNames: ['attending'],
})

export const guestLookupCounter = new client.Counter({
  name: 'rsvp_guest_lookups_total',
  help: 'Total number of guest lookups',
  labelNames: ['result'],
})

export async function pushMetrics() {
  const grafanaUrl = process.env.GRAFANA_PROMETHEUS_URL
  const grafanaUser = process.env.GRAFANA_PROMETHEUS_USER
  const grafanaToken = process.env.GRAFANA_PROMETHEUS_TOKEN

  if (!grafanaUrl || !grafanaUser || !grafanaToken) return

  const metrics = await client.register.metrics()
  const credentials = Buffer.from(`${grafanaUser}:${grafanaToken}`).toString('base64')

  await fetch(`${grafanaUrl}/api/prom/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Authorization': `Basic ${credentials}`,
    },
    body: metrics,
  })
}
