export async function pushMetrics() {
  const grafanaUrl = process.env.GRAFANA_PROMETHEUS_URL
  const grafanaUser = process.env.GRAFANA_PROMETHEUS_USER
  const grafanaToken = process.env.GRAFANA_PROMETHEUS_TOKEN

  console.log('Grafana URL:', grafanaUrl)
  console.log('Grafana User:', grafanaUser)
  console.log('Grafana Token exists:', !!grafanaToken)

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
        'Content-Type': 'text/plain',
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
