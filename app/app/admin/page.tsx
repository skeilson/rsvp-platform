'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

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
    submitted_at: string | null
  }[]
  guest_tags: {
    tags: { name: string }
  }[]
  custom_answers: {
    question_id: string
    answer: string
  }[]
}

export default function AdminDashboardPage() {
  const [guests, setGuests] = useState<GuestWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number, failed: number, total: number } | null>(null)

  async function fetchGuests() {
    try {
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
            note,
	    submitted_at
          ),
          guest_tags (
            tags ( name )
          ),
          custom_answers (
            question_id,
            answer
          )
        `)
        .order('last_name', { ascending: true })

      if (!error && data) {
        setGuests(data as unknown as GuestWithResponse[])
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('name')
    if (data) setAvailableTags(data.map(t => t.name))
  }

  useEffect(() => {
    void fetchGuests()
    void fetchTags()
  }, [])

  async function handleDelete(responseId: string, guestId: string) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return

    if (responseId) {
      await supabase.from('responses').delete().eq('id', responseId)
    }
    await supabase.from('event_responses').delete().eq('guest_id', guestId)
    await supabase.from('custom_answers').delete().eq('guest_id', guestId)
    await supabase
      .from('guests')
      .update({ has_responded: false })
      .eq('id', guestId)

    void fetchGuests()
  }

  async function handleEmailBlast() {
    if (!emailSubject || !emailMessage) return
    setSending(true)
    setSendResult(null)

    const response = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: emailSubject,
        message: emailMessage,
        tags: selectedTags,
      }),
    })

    const result = await response.json()
    setSendResult(result)
    setSending(false)
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
          <div className="flex items-center gap-4">
            
              <a href="/admin/theme"
              className="text-sm text-gray-400 underline underline-offset-4" >
              Theme editor
            </a>
            
              <a href="/api/admin/logout"
              className="text-sm text-gray-400 underline underline-offset-4" >
              Sign out
            </a>
          </div>
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
            const response = guest.responses?.sort((a, b) =>
 	      new Date(b.submitted_at ?? 0.getTime() - new Date(a.submitted_at ?? 0).getTime())[0]
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
                    {guest.custom_answers?.length > 0 && (
                      <div className="space-y-1">
                        {guest.custom_answers.map(ca => {
                          const question = config.customQuestions?.find(q => q.id === ca.question_id)
                          return (
                            <p key={ca.question_id}>
                              <span className="font-medium text-gray-700">
                                {question?.label ?? ca.question_id}:
                              </span>{' '}
                              {ca.answer}
                            </p>
                          )
                        })}
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(response.id, guest.id)}
                      className="text-red-500 text-xs underline underline-offset-2 pt-1"
                    >
                      Delete RSVP
                    </button>
                  </div>
                )}

                {!response && guest.has_responded && (
                  <div className="border-t pt-3">
                    <button
                      onClick={() => handleDelete('', guest.id)}
                      className="text-red-500 text-xs underline underline-offset-2"
                    >
                      Reset RSVP
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Email blast */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium">Email blast</h2>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Filter by tags</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTags.includes(tag)
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {availableTags.length === 0 && (
                <p className="text-sm text-gray-400">No tags found</p>
              )}
            </div>
            {selectedTags.length === 0 && (
              <p className="text-xs text-gray-400">No tags selected — email will be sent to all guests with an email address</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Subject</p>
            <input
              type="text"
              placeholder="Email subject"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Message</p>
            <textarea
              placeholder="Write your message here..."
              value={emailMessage}
              onChange={e => setEmailMessage(e.target.value)}
              rows={6}
              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {sendResult && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
              <p>Sent: {sendResult.sent} of {sendResult.total}</p>
              {sendResult.failed > 0 && (
                <p className="text-red-500">Failed: {sendResult.failed}</p>
              )}
            </div>
          )}

          <button
            onClick={handleEmailBlast}
            disabled={sending || !emailSubject || !emailMessage}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send email blast'}
          </button>
        </div>

      </div>
    </main>
  )
}
