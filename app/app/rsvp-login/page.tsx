'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { config } from '@/lib/config'

export default function RSVPLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const response = await fetch('/api/rsvp/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (!response.ok) {
      setError('Invalid password. Please try again.')
      return
    }

    router.push('/rsvp')
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-sm space-y-6">
        <h1
          className="text-3xl font-medium text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {config.event.name}
        </h1>
        <p
          className="text-center"
          style={{ color: 'var(--color-primary)', opacity: 0.6 }}
        >
          Enter your access password to continue
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
            style={{
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
              opacity: 0.8,
            }}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)',
            }}
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </div>
      </div>
    </main>
  )
}
