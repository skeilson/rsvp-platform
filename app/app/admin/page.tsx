'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type GuestWithResponse = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  has_responded: boolean
  responses: {
    id: string
    attending: boolean
    dietary: string | null
    song_request: string | null
    note: string | null
  }[]
  guest_tags: {
    tags: { name: string }
  }[]
}

export default function AdminDashboardPage() {
  const [guests, setGuests] = useState<GuestWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all')

  useEffect(() => {
    fetchGuests()
  }, [])

  async function fetchGuests() {
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        has_responded,
        responses (
          id,
          attending,
          dietary,
          song_request,
          note
        ),
        guest_tags (
          tags ( name )
        )
      `)
      .order('last_name', { ascending: true })

    if (!error && data) {
      setGuests(data as unknown as GuestWithResponse[])
    }

    setLoading(false)
  }

  async function handleDelete(responseId: string, guestId: string) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return

    await supabase.from('responses').delete().eq('id', responseId)
    await supabase
      .from('guests')
      .update({ has_responded: false })
      .eq('id', guestId)

    fetchGuests()
  }

  const filtered = guests.filter(g => {
    if (filter === 'responded') return g.has_responded
    if (filter === 'pending') return !g.has_responded
    return true
  })

  const stats = {
    total: guests.length,
    responded: guests.filter(g => g.has_responded).length,
    attending: guests.filter(g => g.responses?.[0]?.attending === true).length,
    declined: guests.filter(g => g.responses?.[0]?.attending === false).length,
    pending: guests.filter(g => !g.has_responded).length,
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-medium">Admin dashboard</h1>
          
            <a href="/api/admin/logout">
            <p className="text-sm text-gray-400 underline underline-offset-4">Sign out</p>
            </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total guests', value: stats.total },
            { label: 'Responded', value: stats.responded },
            { label: 'Attending', value: stats.attending },
            { label: 'Pending', value: stats.pending },
          ].map(stat => (
            <div key={stat.label} className="border rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-medium">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'responded', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-gray-900 text-white' : 'border border-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Guest list */}
        <div className="space-y-3">
          {filtered.map(guest => {
            const response = guest.responses?.[0]
            const tags = guest.guest_tags?.map(gt => gt.tags.name) ?? []

            return (
              <div key={guest.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {guest.first_name} {guest.last_name}
                    </p>
                    {guest.email && (
                      <p className="text-sm text-gray-500">{guest.email}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    !guest.has_responded
                      ? 'bg-yellow-50 text-yellow-700'
                      : response?.attending
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {!guest.has_responded
                      ? 'Pending'
                      : response?.attending
                      ? 'Attending'
                      : 'Declined'}
                  </span>
                </div>

                {response && (
                  <div className="text-sm text-gray-500 space-y-1 border-t pt-3">
                    {response.dietary && (
                      <p><span className="font-medium text-gray-700">Dietary:</span> {response.dietary}</p>
                    )}
                    {response.song_request && (
                      <p><span className="font-medium text-gray-700">Song:</span> {response.song_request}</p>
                    )}
                    {response.note && (
                      <p><span className="font-medium text-gray-700">Note:</span> {response.note}</p>
                    )}
                    <button
                      onClick={() => handleDelete(response.id, guest.id)}
                      className="text-red-500 text-xs underline underline-offset-2 pt-1"
                    >
                      Delete RSVP
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
