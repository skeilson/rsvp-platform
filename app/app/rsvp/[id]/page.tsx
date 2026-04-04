'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

type Guest = {
  id: string
  first_name: string
  last_name: string
  tags: { tags: { name: string } }[]
}

export default function RSVPFormPage() {
  const { id } = useParams()
  const router = useRouter()

  const [guest, setGuest] = useState<Guest | null>(null)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [dietary, setDietary] = useState('')
  const [songRequest, setSongRequest] = useState('')
  const [note, setNote] = useState('')
  const [attendingSecondary, setAttendingSecondary] = useState<boolean | null>(null)
  const [shuttle, setShuttle] = useState(false)
  const [meal, setMeal] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const isSecondaryEligible = config.secondaryEvent.enabled &&
    guest?.tags?.some(t => t.tags.name === config.secondaryEvent.tag)

  useEffect(() => {
    async function fetchGuest() {
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
        .eq('id', id)
        .single()

      if (error || !data) {
        router.push('/rsvp')
        return
      }

      setGuest(data as unknown as Guest)
      setLoading(false)
    }

    fetchGuest()
  }, [id])

  async function handleSubmit() {
    if (!guest) return
    setSubmitting(true)

    await supabase.from('responses').insert({
      guest_id: guest.id,
      attending,
      dietary: dietary || null,
      song_request: songRequest || null,
      note: note || null,
    })

    if (isSecondaryEligible && attendingSecondary !== null) {
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('is_primary', false)
        .single()

      if (event) {
        await supabase.from('event_responses').insert({
          guest_id: guest.id,
          event_id: event.id,
          attending: attendingSecondary,
          shuttle: attendingSecondary ? shuttle : false,
          meal: attendingSecondary ? meal || null : null,
        })
      }
    }

    await supabase
      .from('guests')
      .update({ has_responded: true })
      .eq('id', guest.id)

    router.push('/rsvp/confirmation')
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading your invitation...</p>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-medium text-center">
          Hi, {guest?.first_name}
        </h1>

        {/* Primary attendance */}
        <div className="space-y-3">
          <p className="font-medium">Will you be attending {config.primaryEvent.name}?</p>
          <div className="flex gap-4">
            <button
              onClick={() => setAttending(true)}
              className={`flex-1 py-3 rounded-lg border font-medium ${attending === true ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
            >
              {config.primaryEvent.acceptLabel}
            </button>
            <button
              onClick={() => setAttending(false)}
              className={`flex-1 py-3 rounded-lg border font-medium ${attending === false ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
            >
              {config.primaryEvent.declineLabel}
            </button>
          </div>
        </div>

        {/* Attending YES path */}
        {attending === true && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-medium">{config.form.dietaryLabel}</p>
              <input
                type="text"
                placeholder={config.form.dietaryPlaceholder}
                value={dietary}
                onChange={e => setDietary(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium">{config.form.songLabel}</p>
              <input
                type="text"
                placeholder={config.form.songPlaceholder}
                value={songRequest}
                onChange={e => setSongRequest(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium">{config.form.noteLabel}</p>
              <textarea
                placeholder={config.form.notePlaceholder}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            {/* Secondary event */}
            {isSecondaryEligible && (
              <div className="space-y-3 border-t pt-6">
                <p className="font-medium">{config.secondaryEvent.question}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAttendingSecondary(true)}
                    className={`flex-1 py-3 rounded-lg border font-medium ${attendingSecondary === true ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setAttendingSecondary(false)}
                    className={`flex-1 py-3 rounded-lg border font-medium ${attendingSecondary === false ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300'}`}
                  >
                    No
                  </button>
                </div>

                {attendingSecondary === true && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <p className="font-medium">{config.secondaryForm.mealLabel}</p>
                      <input
                        type="text"
                        placeholder={config.secondaryForm.mealPlaceholder}
                        value={meal}
                        onChange={e => setMeal(e.target.value)}
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="shuttle"
                        checked={shuttle}
                        onChange={e => setShuttle(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="shuttle" className="text-base">
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
        {attending === false && (
          <div className="space-y-2">
            <p className="font-medium">{config.form.declineNoteLabel}</p>
            <textarea
              placeholder={config.form.declineNotePlaceholder}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        )}

        {attending !== null && (
          <button
            onClick={handleSubmit}
            disabled={submitting || (isSecondaryEligible && attending && attendingSecondary === null)}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : config.form.submitButton}
          </button>
        )}
      </div>
    </main>
  )
}
