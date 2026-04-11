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
