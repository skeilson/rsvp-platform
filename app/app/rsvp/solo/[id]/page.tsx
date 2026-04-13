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

const inputStyle = {
  border: '1px solid var(--color-primary)',
  color: 'var(--color-primary)',
  backgroundColor: 'transparent',
  opacity: 0.8,
}

const buttonActiveStyle = {
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-background)',
  borderColor: 'var(--color-primary)',
}

const buttonInactiveStyle = {
  backgroundColor: 'transparent',
  color: 'var(--color-primary)',
  borderColor: 'var(--color-primary)',
  opacity: 0.5,
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
    guest?.guest_tags?.some(t => t.tags.name === config.secondaryEvent.tag)

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
  }, [id, router])

  async function handleSubmit() {
    if (!guest) return
    setSubmitting(true)

    await supabase.from('responses').upsert({
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
        await supabase.from('event_responses').upsert({
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

    await fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'rsvp_submission',
        labels: { attending: attending ? 'yes' : 'no' }
      })
    })

    router.push('/rsvp/confirmation')
  }

  if (loading) return (
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
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-md space-y-8">
        <h1
          className="text-3xl font-medium text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          Hi, {guest?.first_name}
        </h1>

        {/* Primary attendance */}
        <div className="space-y-3">
          <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
            Will you be attending {config.primaryEvent.name}?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setAttending(true)}
              className="flex-1 py-3 rounded-lg border font-medium"
              style={attending === true ? buttonActiveStyle : buttonInactiveStyle}
            >
              {config.primaryEvent.acceptLabel}
            </button>
            <button
              onClick={() => setAttending(false)}
              className="flex-1 py-3 rounded-lg border font-medium"
              style={attending === false ? buttonActiveStyle : buttonInactiveStyle}
            >
              {config.primaryEvent.declineLabel}
            </button>
          </div>
        </div>

        {/* Attending YES path */}
        {attending === true && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {config.form.dietaryLabel}
              </p>
              <input
                type="text"
                placeholder={config.form.dietaryPlaceholder}
                value={dietary}
                onChange={e => setDietary(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {config.form.songLabel}
              </p>
              <input
                type="text"
                placeholder={config.form.songPlaceholder}
                value={songRequest}
                onChange={e => setSongRequest(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>

            <div className="space-y-2">
              <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {config.form.noteLabel}
              </p>
              <textarea
                placeholder={config.form.notePlaceholder}
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>

            {/* Secondary event */}
            {isSecondaryEligible && (
              <div className="space-y-3 pt-6" style={{ borderTop: '1px solid var(--color-primary)', opacity: 0.3 }}>
                <p className="font-medium" style={{ color: 'var(--color-primary)', opacity: 1 }}>
                  {config.secondaryEvent.question}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAttendingSecondary(true)}
                    className="flex-1 py-3 rounded-lg border font-medium"
                    style={attendingSecondary === true ? buttonActiveStyle : buttonInactiveStyle}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setAttendingSecondary(false)}
                    className="flex-1 py-3 rounded-lg border font-medium"
                    style={attendingSecondary === false ? buttonActiveStyle : buttonInactiveStyle}
                  >
                    No
                  </button>
                </div>

                {attendingSecondary === true && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                        {config.secondaryForm.mealLabel}
                      </p>
                      <input
                        type="text"
                        placeholder={config.secondaryForm.mealPlaceholder}
                        value={meal}
                        onChange={e => setMeal(e.target.value)}
                        className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                        style={inputStyle}
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
                      <label
                        htmlFor="shuttle"
                        className="text-base"
                        style={{ color: 'var(--color-primary)' }}
                      >
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
            <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
              {config.form.declineNoteLabel}
            </p>
            <textarea
              placeholder={config.form.declineNotePlaceholder}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        )}

        {attending !== null && (
          <button
            onClick={handleSubmit}
            disabled={submitting || (isSecondaryEligible && attending && attendingSecondary === null)}
            className="w-full rounded-lg px-4 py-3 text-base font-medium disabled:opacity-50"
            style={buttonActiveStyle}
          >
            {submitting ? 'Submitting...' : config.form.submitButton}
          </button>
        )}
      </div>
    </main>
  )
}
