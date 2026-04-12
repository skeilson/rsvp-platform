'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

type Guest = {
  id: string
  first_name: string
  last_name: string
  guest_tags: { tags: { name: string } }[]
}

type GuestResponse = {
  attending: boolean | null
  dietary: string
  songRequest: string
  note: string
  attendingSecondary: boolean | null
  shuttle: boolean
  meal: string
}

const defaultResponse = (): GuestResponse => ({
  attending: null,
  dietary: '',
  songRequest: '',
  note: '',
  attendingSecondary: null,
  shuttle: false,
  meal: '',
})

export default function GroupRSVPPage() {
  const { group_id } = useParams()
  const router = useRouter()

  const [guests, setGuests] = useState<Guest[]>([])
  const [responses, setResponses] = useState<Record<string, GuestResponse>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchGroup() {
      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          first_name,
          last_name,
          guest_tags (
            tags ( name )
          )
        `)
        .eq('group_id', group_id)
        .order('first_name', { ascending: true })

      if (error || !data || data.length === 0) {
        router.push('/rsvp')
        return
      }

      setGuests(data as unknown as Guest[])

      const initialResponses: Record<string, GuestResponse> = {}
      data.forEach(g => {
        initialResponses[g.id] = defaultResponse()
      })
      setResponses(initialResponses)
      setLoading(false)
    }

    fetchGroup()
  }, [group_id, router])

  function updateResponse(guestId: string, field: keyof GuestResponse, value: unknown) {
    setResponses(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [field]: value,
      }
    }))
  }

  function isSecondaryEligible(guest: Guest) {
    return config.secondaryEvent.enabled &&
      guest.guest_tags?.some(t => t.tags.name === config.secondaryEvent.tag)
  }

  async function handleSubmit() {
    setSubmitting(true)

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('is_primary', false)
      .single()

    for (const guest of guests) {
      const r = responses[guest.id]
      if (r.attending === null) continue

      await supabase.from('responses').insert({
        guest_id: guest.id,
        attending: r.attending,
        dietary: r.dietary || null,
        song_request: r.songRequest || null,
        note: r.note || null,
      })

      if (isSecondaryEligible(guest) && r.attendingSecondary !== null && event) {
        await supabase.from('event_responses').insert({
          guest_id: guest.id,
          event_id: event.id,
          attending: r.attendingSecondary,
          shuttle: r.attendingSecondary ? r.shuttle : false,
          meal: r.attendingSecondary ? r.meal || null : null,
        })
      }

      await supabase
        .from('guests')
        .update({ has_responded: true })
        .eq('id', guest.id)

      await fetch('/api/metrics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'rsvp_submission',
          labels: { attending: r.attending ? 'yes' : 'no' }
        })
      })
    }

    router.push('/rsvp/confirmation')
  }

  const allAnswered = guests.every(g => responses[g.id]?.attending !== null)

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading your invitation...</p>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-10">
        <h1 className="text-3xl font-medium text-center">
          {guests.map(g => g.first_name).join(' & ')}
        </h1>

        {guests.map(guest => {
          const r = responses[guest.id]
          if (!r) return null
          const eligible = isSecondaryEligible(guest)

          return (
            <div key={guest.id} className="space-y-6 border-t pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-xl font-medium">{guest.first_name} {guest.last_name}</h2>

              {/* Primary attendance */}
              <div className="space-y-3">
                <p className="font-medium">Will you be attending {config.primaryEvent.name}?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateResponse(guest.id, 'attending', true)}
                    className={`flex-1 py-3 rounded-lg border font-medium ${r.attending === true ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                  >
                    {config.primaryEvent.acceptLabel}
                  </button>
                  <button
                    onClick={() => updateResponse(guest.id, 'attending', false)}
                    className={`flex-1 py-3 rounded-lg border font-medium ${r.attending === false ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                  >
                    {config.primaryEvent.declineLabel}
                  </button>
                </div>
              </div>

              {/* Attending YES path */}
              {r.attending === true && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="font-medium">{config.form.dietaryLabel}</p>
                    <input
                      type="text"
                      placeholder={config.form.dietaryPlaceholder}
                      value={r.dietary}
                      onChange={e => updateResponse(guest.id, 'dietary', e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">{config.form.songLabel}</p>
                    <input
                      type="text"
                      placeholder={config.form.songPlaceholder}
                      value={r.songRequest}
                      onChange={e => updateResponse(guest.id, 'songRequest', e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">{config.form.noteLabel}</p>
                    <textarea
                      placeholder={config.form.notePlaceholder}
                      value={r.note}
                      onChange={e => updateResponse(guest.id, 'note', e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  {/* Secondary event */}
                  {eligible && (
                    <div className="space-y-3 border-t pt-6">
                      <p className="font-medium">{config.secondaryEvent.question}</p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateResponse(guest.id, 'attendingSecondary', true)}
                          className={`flex-1 py-3 rounded-lg border font-medium ${r.attendingSecondary === true ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateResponse(guest.id, 'attendingSecondary', false)}
                          className={`flex-1 py-3 rounded-lg border font-medium ${r.attendingSecondary === false ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                        >
                          No
                        </button>
                      </div>

                      {r.attendingSecondary === true && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <p className="font-medium">{config.secondaryForm.mealLabel}</p>
                            <input
                              type="text"
                              placeholder={config.secondaryForm.mealPlaceholder}
                              value={r.meal}
                              onChange={e => updateResponse(guest.id, 'meal', e.target.value)}
                              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`shuttle-${guest.id}`}
                              checked={r.shuttle}
                              onChange={e => updateResponse(guest.id, 'shuttle', e.target.checked)}
                              className="w-4 h-4"
                            />
                            <label htmlFor={`shuttle-${guest.id}`} className="text-base">
                              {config.secondaryForm.shuttleLabel}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Attending NO path */}
              {r.attending === false && (
                <div className="space-y-2">
                  <p className="font-medium">{config.form.declineNoteLabel}</p>
                  <textarea
                    placeholder={config.form.declineNotePlaceholder}
                    value={r.note}
                    onChange={e => updateResponse(guest.id, 'note', e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Submit */}
        {allAnswered && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : config.form.submitButton}
          </button>
        )}
      </div>
    </main>
  )
}
