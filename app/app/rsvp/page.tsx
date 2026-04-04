'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
      .select('id')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .single()

    setLoading(false)

    if (error || !data) {
      setError("We couldn't find your name on the guest list. Please check your spelling and try again.")
      return
    }

    router.push(`/rsvp/${data.id}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-medium text-center">RSVP</h1>
        <p className="text-center text-gray-500">Enter your name as it appears on your invitation</p>

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
            {loading ? 'Looking up...' : 'Find my invitation'}
          </button>
        </div>
      </div>
    </main>
  )
}
