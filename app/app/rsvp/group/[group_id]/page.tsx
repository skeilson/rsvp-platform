'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'
import CustomQuestions from '@/components/customQuestions'
import { saveCustomAnswers, applyTagsFromAnswers } from '@/lib/customAnswers'
import ThemeImages from '@/components/themeImages'

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
  meal: string
}

const defaultResponse = (): GuestResponse => ({
  attending: null,
  dietary: '',
  songRequest: '',
  note: '',
  attendingSecondary: null,
  meal: '',
})

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

export default function GroupRSVPPage() {
  const { group_id } = useParams()
  const router = useRouter()

  const [guests, setGuests] = useState<Guest[]>([])
  const [responses, setResponses] = useState<Record<string, GuestResponse>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customAnswers, setCustomAnswers] = useState<Record<string, Record<string, string>>>({})

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

      await supabase.from('responses').upsert({
        guest_id: guest.id,
        attending: r.attending,
        dietary: r.dietary || null,
        song_request: r.songRequest || null,
        note: r.note || null,
      })

      if (isSecondaryEligible(guest) && r.attendingSecondary !== null && event) {
        await supabase.from('event_responses').upsert({
          guest_id: guest.id,
          event_id: event.id,
          attending: r.attendingSecondary,
          meal: r.attendingSecondary ? r.meal || null : null,
        })
      }

      await supabase
        .from('guests')
        .update({ has_responded: true })
        .eq('id', guest.id)

      await saveCustomAnswers(guest.id, customAnswers[guest.id] ?? {})
      await applyTagsFromAnswers(guest.id, customAnswers[guest.id] ?? {}, config.customQuestions ?? [])

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

  function handleCustomAnswer(guestId: string, questionId: string, answer: string) {
    setCustomAnswers(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [questionId]: answer,
      }
    }))
  }

  if (loading) return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <p style={{ color: 'var(--color-primary)', opacity: 0.5 }}>
        Loading your invitation...
      </p>
    </main>
  )

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-md space-y-10">
	<ThemeImages />
        <h1
          className="text-3xl font-medium text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {guests.map(g => g.first_name).join(' & ')}
        </h1>

        {guests.map(guest => {
          const r = responses[guest.id]
          if (!r) return null
          const eligible = isSecondaryEligible(guest)

          return (
            <div
              key={guest.id}
              className="space-y-6 pt-6 first:pt-0"
              style={{ borderTop: '1px solid var(--color-primary)', opacity: 1 }}
            >
              <h2
                className="text-xl font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                {guest.first_name} {guest.last_name}
              </h2>

              {/* Primary attendance */}
              <div className="space-y-3">
                <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                  Will you be attending {config.primaryEvent.name}?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateResponse(guest.id, 'attending', true)}
                    className="flex-1 py-3 rounded-lg border font-medium"
                    style={r.attending === true ? buttonActiveStyle : buttonInactiveStyle}
                  >
                    {config.primaryEvent.acceptLabel}
                  </button>
                  <button
                    onClick={() => updateResponse(guest.id, 'attending', false)}
                    className="flex-1 py-3 rounded-lg border font-medium"
                    style={r.attending === false ? buttonActiveStyle : buttonInactiveStyle}
                  >
                    {config.primaryEvent.declineLabel}
                  </button>
                </div>
              </div>

              {/* Attending YES path */}
              {r.attending === true && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                      {config.form.dietaryLabel}
                    </p>
                    <input
                      type="text"
                      placeholder={config.form.dietaryPlaceholder}
                      value={r.dietary}
                      onChange={e => updateResponse(guest.id, 'dietary', e.target.value)}
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
                      value={r.songRequest}
                      onChange={e => updateResponse(guest.id, 'songRequest', e.target.value)}
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
                      value={r.note}
                      onChange={e => updateResponse(guest.id, 'note', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                      style={inputStyle}
                    />
                  </div>

                  <CustomQuestions
                    questions={config.customQuestions ?? []}
                    answers={customAnswers[guest.id] ?? {}}
                    onChange={(questionId, answer) => handleCustomAnswer(guest.id, questionId, answer)}
                    showWhen="attending"
                  />

                  {/* Secondary event */}
                  {eligible && (
                    <div
                      className="space-y-3 pt-6"
                      style={{ borderTop: '1px solid var(--color-primary)' }}
                    >
                      <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                        {config.secondaryEvent.question}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => updateResponse(guest.id, 'attendingSecondary', true)}
                          className="flex-1 py-3 rounded-lg border font-medium"
                          style={r.attendingSecondary === true ? buttonActiveStyle : buttonInactiveStyle}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateResponse(guest.id, 'attendingSecondary', false)}
                          className="flex-1 py-3 rounded-lg border font-medium"
                          style={r.attendingSecondary === false ? buttonActiveStyle : buttonInactiveStyle}
                        >
                          No
                        </button>
                      </div>

                      {r.attendingSecondary === true && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                              {config.secondaryForm.mealLabel}
                            </p>
                            <input
                              type="text"
                              placeholder={config.secondaryForm.mealPlaceholder}
                              value={r.meal}
                              onChange={e => updateResponse(guest.id, 'meal', e.target.value)}
                              className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                              style={inputStyle}
                            />
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
                  <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                    {config.form.declineNoteLabel}
                  </p>
                  <textarea
                    placeholder={config.form.declineNotePlaceholder}
                    value={r.note}
                    onChange={e => updateResponse(guest.id, 'note', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )
        })}

        {guests.map(guest => (
          <CustomQuestions
            key={guest.id}
            questions={config.customQuestions ?? []}
            answers={customAnswers[guest.id] ?? {}}
            onChange={(questionId, answer) => handleCustomAnswer(guest.id, questionId, answer)}
            showWhen="always"
          />
        ))}

        {/* Submit */}
        {allAnswered && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
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
