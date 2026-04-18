'use client'

import { useState, useEffect } from 'react'
import { config } from '@/lib/config'

type EventResponse = {
  id: string
  event_id: string
  attending: boolean
  answers: Record<string, string> | null
}

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
  event_responses: EventResponse[]
}

export default function AdminDashboardPage() {
  const [guests, setGuests] = useState<GuestWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all')
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([])
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [tagIdsByName, setTagIdsByName] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number, failed: number, total: number } | null>(null)

  async function fetchGuests() {
    try {
      const res = await fetch('/api/admin/guests')
      if (res.ok) {
        const data = await res.json()
        setGuests(data as GuestWithResponse[])
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchTags() {
    const res = await fetch('/api/admin/tags')
    if (!res.ok) return
    const data = (await res.json()) as { id: string; name: string }[]
    setAvailableTags(data.map(t => t.name))
    setTagIdsByName(Object.fromEntries(data.map(t => [t.name, t.id])))
  }

  useEffect(() => {
    void fetchGuests()
    void fetchTags()
  }, [])

  async function handleDelete(responseId: string, guestId: string) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return

    await fetch('/api/admin/delete-rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId, guestId }),
    })

    void fetchGuests()
  }

  async function handleAddTag(guestId: string, tagName: string) {
    const tagId = tagIdsByName[tagName]
    if (!tagId) return

    await fetch('/api/admin/guest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, tagId }),
    })

    void fetchGuests()
  }

  async function handleRemoveTag(guestId: string, tagName: string) {
    const tagId = tagIdsByName[tagName]
    if (!tagId) return

    await fetch('/api/admin/guest-tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, tagId }),
    })

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
    const matchesStatus =
      filter === 'responded' ? g.has_responded :
      filter === 'pending' ? !g.has_responded :
      true

    const guestTagNames = g.guest_tags?.map(gt => gt.tags.name) ?? []
    const matchesTags = selectedFilterTags.length === 0 ||
      selectedFilterTags.every(tag => guestTagNames.includes(tag))

    return matchesStatus && matchesTags
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
            
              href="/admin/theme"
              className="text-sm text-gray-400 underline underline-offset-4"
            >
              Theme editor
            </a>
            
              href="/api/admin/logout"
              className="text-sm text-gray-400 underline underline-offset-4"
            >
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

        {/* Status filter */}
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

        {/* Tag filter */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">Filter by tag</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedFilterTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFilterTags.includes(tag)
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedFilterTags.length > 0 && (
                <button
                  onClick={() => setSelectedFilterTags([])}
                  className="px-3 py-1 rounded-full text-sm font-medium text-gray-400 underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Guest list */}
        <div className="space-y-3">
          {filtered.map(guest => {
            const response = Array.isArray(guest.responses)
              ? guest.responses.sort((a, b) =>
                  new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime()
                )[0]
              : guest.responses ?? undefined
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

                    {/* Tag management */}
                    <div className="mt-2">
                      {editingTagsFor === guest.id ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(guest.id, tag)}
                                  className="text-gray-400 hover:text-red-500 font-medium"
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {availableTags
                              .filter(t => !tags.includes(t))
                              .map(tag => (
                                <button
                                  key={tag}
                                  onClick={() => handleAddTag(guest.id, tag)}
                                  className="text-xs border border-dashed border-gray-300 text-gray-400 px-2 py-0.5 rounded-full hover:border-gray-500 hover:text-gray-600"
                                >
                                  + {tag}
                                </button>
                              ))}
                          </div>
                          <button
                            onClick={() => setEditingTagsFor(null)}
                            className="text-xs text-gray-400 underline underline-offset-2"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
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
                          <button
                            onClick={() => setEditingTagsFor(guest.id)}
                            className="text-xs text-gray-400 underline underline-offset-2"
                          >
                            Edit tags
                          </button>
                        </div>
                      )}
                    </div>
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

                    {/* Event responses */}
                    {guest.event_responses?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {guest.event_responses.map(er => {
                          const event = config.events?.find(e => e.id === er.event_id)
                          return (
                            <div key={er.event_id}>
                              <p>
                                <span className="font-medium text-gray-700">
                                  {event?.name ?? er.event_id}:
                                </span>{' '}
                                <span className={er.attending ? 'text-green-600' : 'text-red-500'}>
                                  {er.attending ? 'Attending' : 'Not attending'}
                                </span>
                              </p>
                              {er.attending && er.answers && Object.entries(er.answers).map(([fieldId, answer]) => {
                                const field = event?.fields?.find(f => f.id === fieldId)
                                return (
                                  <p key={fieldId} className="ml-3">
                                    <span className="font-medium text-gray-700">
                                      {field?.label ?? fieldId}:
                                    </span>{' '}
                                    {answer}
                                  </p>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Custom answers */}
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
            {sending ? 'Se
