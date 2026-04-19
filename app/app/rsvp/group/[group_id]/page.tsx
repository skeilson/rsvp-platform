'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { config } from '@/lib/config'
import CustomQuestions from '@/components/customQuestions'
import ConditionalEvents from '@/components/ConditionalEvents'
import ThemeImages from '@/components/themeImages'

type Guest = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  guest_tags: { tags: { name: string } }[]
}

type GuestResponse = {
  attending: boolean | null
  dietary: string
  songRequest: string
  note: string
}

type EventResponse = {
  attending: boolean | null
  answers: Record<string, string>
}

const defaultResponse = (): GuestResponse => ({
  attending: null,
  dietary: '',
  songRequest: '',
  note: '',
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
  const router = useRouter()

  const [guests, setGuests] = useState<Guest[]>([])
  const [responses, setResponses] = useState<Record<string, GuestResponse>>({})
  const [emails, setEmails] = useState<Record<string, string>>({})
  const [eventResponses, setEventResponses] = useState<Record<string, Record<string, EventResponse>>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customAnswers, setCustomAnswers] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    async function fetchGroup() {
      const res = await fetch('/api/rsvp/group')
      if (!res.ok) {
        router.push('/rsvp')
        return
      }

      const data = await res.json() as Guest[]
      setGuests(data)

      const initialResponses: Record<string, GuestResponse> = {}
      const initialEmails: Record<string, string> = {}
      data.forEach(g => {
        initialResponses[g.id] = defaultResponse()
        initialEmails[g.id] = g.email ?? ''
      })
      setResponses(initialResponses)
      setEmails(initialEmails)
      setLoading(false)
    }

    fetchGroup()
  }, [router])

  function updateResponse(guestId: string, field: keyof GuestResponse, value: unknown) {
    setResponses(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [field]: value,
      }
    }))
  }

  function updateEmail(guestId: string, value: string) {
    setEmails(prev => ({ ...prev, [guestId]: value }))
  }

  function handleEventChange(guestId: string, eventId: string, field: 'attending', value: boolean) {
    setEventResponses(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [eventId]: {
          ...prev[guestId]?.[eventId],
          attending: value,
          answers: prev[guestId]?.[eventId]?.answers ?? {},
        }
      }
    }))
  }

  function handleEventAnswerChange(guestId: string, eventId: string, fieldId: string, value: string) {
    setEventResponses(prev => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        [eventId]: {
          ...prev[guestId]?.[eventId],
          attending: prev[guestId]?.[eventId]?.attending ?? null,
          answers: {
            ...prev[guestId]?.[eventId]?.answers,
            [fieldId]: value,
          }
        }
      }
    }))
  }

  function getGuestTags(guest: Guest): string[] {
    return guest.guest_tags?.map(t => t.tags.name) ?? []
  }

  function getEligibleEvents(guest: Guest) {
    const tags = getGuestTags(guest)
    return (config.events ?? []).filter(e => tags.includes(e.tag))
  }

  function allEventsAnswered(guest: Guest): boolean {
    const eligible = getEligibleEvents(guest)
    return eligible.every(
      e => eventResponses[guest.id]?.[e.id]?.attending !== null &&
           eventResponses[guest.id]?.[e.id]?.attending !== undefined
    )
  }

  async function handleSubmit() {
    setSubmitting(true)

    const submissions = guests
      .filter(g => responses[g.id]?.attending !== null)
      .map(g => {
        const r = responses[g.id]
        return {
          guestId: g.id,
          attending: r.attending,
          email: emails[g.id] || null,
          dietary: r.dietary || null,
          songRequest: r.songRequest || null,
          note: r.note || null,
          eventResponses: eventResponses[g.id] ?? {},
          customAnswers: customAnswers[g.id] ?? {},
        }
      })

    if (submissions.length === 0) {
      setSubmitting(false)
      return
    }

    const res = await fetch('/api/rsvp/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissions }),
    })

    if (!res.ok) {
      setSubmitting(false)
      return
    }

    for (const s of submissions) {
      await fetch('/api/metrics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'rsvp_submission',
          labels: { attending: s.attending ? 'yes' : 'no' }
        })
      })
    }

    router.push('/rsvp/confirmation')
  }

  const allAnswered = guests.every(g => responses[g.id]?.attending !== null)
  const allEmailsProvided = !config.form.emailRequired ||
    guests.every(g => responses[g.id]?.attending !== true || emails[g.id]?.trim())
  const allGuestEventsAnswered = guests.every(g =>
    responses[g.id]?.attending !== true || allEventsAnswered(g)
  )

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
          const guestTags = getGuestTags(guest)

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

                  {/* Conditional events */}
                  <ConditionalEvents
                    events={config.events ?? []}
                    guestTags={guestTags}
                    responses={eventResponses[guest.id] ?? {}}
                    onChange={(eventId, field, value) => handleEventChange(guest.id, eventId, field, value)}
                    onAnswerChange={(eventId, fieldId, value) => handleEventAnswerChange(guest.id, eventId, fieldId, value)}
                  />
                  {/* Email */}
                  <div className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                      {config.form.emailLabel}
                      {config.form.emailRequired && (
                        <span style={{ color: 'var(--color-accent)' }}> *</span>
                      )}
                    </p>
                   <input
                     type="email"
                     placeholder={config.form.emailPlaceholder}
                     value={emails[guest.id] ?? ''}
                     onChange={e => updateEmail(guest.id, e.target.value)}
                     className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                     style={inputStyle}
                   />
                 </div>
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
            disabled={submitting || !allEmailsProvided || !allGuestEventsAnswered}
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
