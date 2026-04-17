import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createHmac } from 'crypto'

const originalEnv = { ...process.env }

// session.ts reads SESSION_SECRET lazily, so we set it before each test and
// re-import fresh to avoid module-level caching surprises.
async function importSession() {
  const mod = await import('./session?t=' + Date.now())
  return mod as typeof import('./session')
}

describe('session.ts', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'a'.repeat(32)
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
  })

  afterAll(() => {
    process.env = { ...originalEnv }
  })

  it('round-trips a minted token for its own type', async () => {
    const { createSessionToken, validateSessionToken } = await importSession()
    expect(validateSessionToken(createSessionToken('admin'), 'admin')).toBe(true)
    expect(validateSessionToken(createSessionToken('rsvp'), 'rsvp')).toBe(true)
  })

  it('rejects a token issued for the other type', async () => {
    const { createSessionToken, validateSessionToken } = await importSession()
    expect(validateSessionToken(createSessionToken('admin'), 'rsvp')).toBe(false)
  })

  it('rejects a token with a tampered hmac', async () => {
    const { createSessionToken, validateSessionToken } = await importSession()
    const token = createSessionToken('admin')
    expect(validateSessionToken(token.slice(0, -1) + '0', 'admin')).toBe(false)
  })

  it('rejects a token signed with a different secret', async () => {
    const { validateSessionToken } = await importSession()
    const payload = `admin:${Date.now()}:${'a'.repeat(32)}`
    const wrongHmac = createHmac('sha256', 'wrong'.repeat(10)).update(payload).digest('hex')
    expect(validateSessionToken(`${payload}:${wrongHmac}`, 'admin')).toBe(false)
  })

  it('rejects a token past its max-age', async () => {
    const { validateSessionToken } = await importSession()
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    const payload = `admin:${twoDaysAgo}:${'a'.repeat(32)}`
    const hmac = createHmac('sha256', 'a'.repeat(32)).update(payload).digest('hex')
    expect(validateSessionToken(`${payload}:${hmac}`, 'admin')).toBe(false)
  })

  it('safeEqual handles equal, unequal, and length-mismatched strings', async () => {
    const { safeEqual } = await importSession()
    expect(safeEqual('hunter2', 'hunter2')).toBe(true)
    expect(safeEqual('hunter2', 'hunter3')).toBe(false)
    expect(safeEqual('short', 'a longer string')).toBe(false)
  })
})
