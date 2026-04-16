'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import ThemeImages from '@/components/themeImages'

export default function RSVPLookupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLookup() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('guests')
      .select('id, group_id, has_responded')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .single()

    setLoading(false)

    if (error || !data) {
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

    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'guest_lookup',
        labels: { result: 'found' }
      })
    })

    if (data.has_responded && !config.rsvp.allowChanges) {
      router.push('/rsvp/responded')
      return
    }

    if (data.group_id) {
      router.push(`/rsvp/group/${data.group_id}`)
    } else {
      router.push(`/rsvp/solo/${data.id}`)
    }
  }

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
