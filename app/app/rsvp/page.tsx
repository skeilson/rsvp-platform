'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

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
      .select('id, group_id')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .single()

    setLoading(false)

    if (error || !data) {
      setError(config.form.notFoundMessage)
      return
    }

    if (data.group_id) {
      router.push('/rsvp/group/${data.group_id}')
    } else {
      router.push('/rsvp/solo/${data.id}')
    }
  }

    // On success
    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'guest_lookup',
        labels: { result: 'found' }
      })
    })
	   
    // On failure
    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'guest_lookup',
        labels: { result: 'not_found' }
      })
    })

    router.push(`/rsvp/${data.id}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-medium text-center">
          {config.form.lookupTitle}
        </h1>
        <p className="text-center text-gray-500">
          {config.form.lookupSubtitle}
        </p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleLookup}
            disabled={loading || !firstName || !lastName}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
          >
            {loading ? 'Looking up...' : config.form.lookupButton}
          </button>
        </div>
      </div>
    </main>
  )
}
