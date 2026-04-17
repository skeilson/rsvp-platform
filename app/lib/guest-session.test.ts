import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createHmac } from 'crypto'

const originalEnv = { ...process.env }

async function importGuestSession() {
  const mod = await import('./guest-session?t=' + Date.now())
  return mod as typeof import('./guest-session')
}

describe('guest-session.ts', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'b'.repeat(32)
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
  })

  afterAll(() => {
    process.env = { ...originalEnv }
  })

  it('round-trips solo and group claims', async () => {
    const { createGuestToken, readGuestClaims } = await importGuestSession()
    expect(readGuestClaims(createGuestToken({ guestId: 'g1', groupId: null })))
      .toEqual({ guestId: 'g1', groupId: null })
    expect(readGuestClaims(createGuestToken({ guestId: 'g1', groupId: 'grp-42' })))
      .toEqual({ guestId: 'g1', groupId: 'grp-42' })
  })

  it('returns null for missing, malformed, or mis-prefixed tokens', async () => {
    const { readGuestClaims } = await importGuestSession()
    expect(readGuestClaims(undefined)).toBeNull()
    expect(readGuestClaims('')).toBeNull()
    expect(readGuestClaims('admin:123:abc:def:ghi:jkl')).toBeNull() // wrong prefix
    expect(readGuestClaims('g:only:three:fields')).toBeNull() // wrong field count
  })

  it('rejects tokens whose hmac has been tampered', async () => {
    const { createGuestToken, readGuestClaims } = await importGuestSession()
    const token = createGuestToken({ guestId: 'g1', groupId: null })
    const corrupted = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    expect(readGuestClaims(corrupted)).toBeNull()
  })

  it('rejects a token signed with a different secret', async () => {
    const { readGuestClaims } = await importGuestSession()
    const payload = `g:g1:grp:${Date.now()}:aa`
    const wrongHmac = createHmac('sha256', 'different'.repeat(5)).update(payload).digest('hex')
    expect(readGuestClaims(`${payload}:${wrongHmac}`)).toBeNull()
  })

  it('rejects a token past its max-age', async () => {
    const { readGuestClaims } = await importGuestSession()
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    const payload = `g:g1:-:${twoDaysAgo}:aa`
    const hmac = createHmac('sha256', 'b'.repeat(32)).update(payload).digest('hex')
    expect(readGuestClaims(`${payload}:${hmac}`)).toBeNull()
  })
})
