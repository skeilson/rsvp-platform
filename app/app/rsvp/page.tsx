'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { config } from '@/lib/config'
import ThemeImages from '@/components/themeImages'

export default function RSVPLookupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const token = searchParams.get('token')
  const [validatingToken] = useState(token !== null)

  useEffect(() => {
    if (!token) return

    fetch(`/api/rsvp/token?token=${encodeURIComponent(token)}`)
      .then(res => {
        if (res.ok) {
          window.location.href = '/rsvp'
        } else {
          window.location.href = '/not-found'
        }
      })
      .catch(() => {
        window.location.href = '/not-found'
      })
  }, [token])

  async function handleLookup() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/rsvp/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName }),
    })

    setLoading(false)

    if (!res.ok) {
      setError(config.form.notFoundMessage)
      await fetch('/api/metrics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'guest_lookup',
          labels: { result: 'not_found' }
        })
      })
      return
    }

    const result = await res.json() as { redirectTo: string }
    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'guest_lookup',
        labels: { result: 'found' }
      })
    })

    router.push(result.redirectTo)
  }

  if (validatingToken) return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <p style={{ color: 'var(--color-primary)', opacity: 0.5 }}>
        Loading your invitation...
      </p>
    </main>
  )

  return (
    <main
      className="min-h-screen flex flex-col items-center p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-md space-y-6">
        <ThemeImages />
        <h1
          className="text-3xl font-medium text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {config.form.lookupTitle}
        </h1>
        <p
          className="text-center"
          style={{ color: 'var(--color-primary)', opacity: 0.6 }}
        >
          {config.form.lookupSubtitle}
        </p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
            style={{
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
              opacity: 0.8,
            }}
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
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
            onClick={handleLookup}
            disabled={loading || !firstName || !lastName}
            className="w-full rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)',
            }}
          >
            {loading ? 'Looking up...' : config.form.lookupButton}
          </button>
        </div>
      </div>
    </main>
  )
}
