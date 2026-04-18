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

type EventResponse = {
  attending: boolean | null
  answers: Record<string, string>
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
  const router = useRouter()

  const [guest, setGuest] = useState<Guest | null>(null)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [dietary, setDietary] = useState('')
  const [songRequest, setSongRequest] = useState('')
  const [note, setNote] = useState('')
  const [eventResponses, setEventResponses] = useState<Record<string, EventResponse>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const guestTags = guest?.guest_tags?.map(t => t.tags.name) ?? []
  const eligibleEvents = (config.events ?? []).filter(e => guestTags.includes(e.tag))
  const allEventsAnswered = eligibleEvents.every(
    e => eventResponses[e.id]?.attending !== null && eventResponses[e.id]?.attending !== undefined
  )

  useEffect(() => {
    async function fetchGuest() {
      const res = await fetch('/api/rsvp/guest')
      if (!res.ok) {
        router.push('/rsvp')
        return
      }

      const data = await res.json() as Guest
      setGuest(data)
      if (data.email) setEmail(data.email)
      setLoading(false)
    }

    fetchGuest()
  }, [router])

  function handleEventChange(eventId: string, field: 'attending', value: boolean) {
    setEventResponses(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        attending: value,
        answers: prev[eventId]?.answers ?? {},
      }
    }))
  }

  function handleEventAnswerChange(eventId: string, fieldId: string, value: string) {
    setEventResponses(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        attending: prev[eventId]?.attending ?? null,
        answers: {
          ...prev[eventId]?.answers,
          [fieldId]: value,
        }
      }
    }))
  }

  async function handleSubmit() {
    if (!guest) return
    setSubmitting(true)

    const res = await fetch('/api/rsvp/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissions: [{
          guestId: guest.id,
          attending,
          email: email || null,
          dietary: dietary || null,
          songRequest: songRequest || null,
          note: note || null,
          eventResponses,
          customAnswers,
        }],
      }),
    })

    if (!res.ok) {
      setSubmitting(false)
      return
    }

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

  function handleCustomAnswer(questionId: string, answer: string) {
    setCustomAnswers(prev => ({ ...prev, [questionId]: answer }))
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
      <div className="w-full max-w-md space-y-8">
        <ThemeImages />
        <h1
          className="text-3xl font-medium text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          Hi, {guest?.first_name}
        </h1>

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
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
            style={inputStyle}
          />
        </div>

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
