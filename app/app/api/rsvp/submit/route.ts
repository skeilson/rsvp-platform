import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { readGuestClaimsFromRequest } from '@/lib/guest-session'
import { config, CustomQuestion, ConditionalEvent } from '@/lib/config'

type EventResponse = {
  attending: boolean
  answers?: Record<string, string>
}

type GuestSubmission = {
  guestId: string
  attending: boolean
  email?: string | null
  dietary?: string | null
  songRequest?: string | null
  note?: string | null
  eventResponses?: Record<string, EventResponse>
  customAnswers?: Record<string, string>
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function nullableTrimmed(v: unknown, max: number): string | null {
  if (!isString(v)) return null
  const t = v.trim()
  if (!t) return null
  return t.slice(0, max)
}

function parseEventResponses(raw: unknown): Record<string, EventResponse> {
  const result: Record<string, EventResponse> = {}
  if (typeof raw !== 'object' || raw === null) return result

  for (const [eventId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    if (typeof v.attending !== 'boolean') continue

    const answers: Record<string, string> = {}
    if (typeof v.answers === 'object' && v.answers !== null) {
      for (const [k, a] of Object.entries(v.answers as Record<string, unknown>)) {
        if (isString(k) && isString(a) && a.length <= 2000) answers[k] = a
      }
    }

    result[eventId] = { attending: v.attending, answers }
  }

  return result
}

function parseSubmission(raw: unknown): GuestSubmission | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (!isString(r.guestId) || !r.guestId) return null
  if (typeof r.attending !== 'boolean') return null

  const customAnswers: Record<string, string> = {}
  if (typeof r.customAnswers === 'object' && r.customAnswers !== null) {
    for (const [k, v] of Object.entries(r.customAnswers as Record<string, unknown>)) {
      if (isString(k) && isString(v) && v.length <= 2000) customAnswers[k] = v
    }
  }

  return {
    guestId: r.guestId,
    attending: r.attending,
    email: nullableTrimmed(r.email, 200),
    dietary: nullableTrimmed(r.dietary, 500),
    songRequest: nullableTrimmed(r.songRequest, 500),
    note: nullableTrimmed(r.note, 2000),
    eventResponses: parseEventResponses(r.eventResponses),
    customAnswers,
  }
}

async function saveCustomAnswers(
  supabase: SupabaseClient,
  guestId: string,
  answers: Record<string, string>
) {
  const rows = Object.entries(answers)
    .filter(([, answer]) => answer !== '')
    .map(([questionId, answer]) => ({
      guest_id: guestId,
      question_id: questionId,
      answer,
    }))

  if (rows.length === 0) return
  await supabase.from('custom_answers').upsert(rows, {
    onConflict: 'guest_id,question_id',
  })
}

async function applyTagsFromAnswers(
  supabase: SupabaseClient,
  guestId: string,
  answers: Record<string, string>,
  questions: CustomQuestion[]
) {
  for (const question of questions) {
    if (!question.tagOnAnswer) continue
    const answer = answers[question.id]
    if (!answer) continue
    const tagName = question.tagOnAnswer[answer]
    if (!tagName) continue

    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .maybeSingle()

    let tagId = existingTag?.id
    if (!tagId) {
      const { data: newTag } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select('id')
        .single()
      tagId = newTag?.id
    }
    if (!tagId) continue

    const allTagNames = Object.values(question.tagOnAnswer)
    const { data: tagsToRemove } = await supabase
      .from('tags')
      .select('id')
      .in('name', allTagNames)

    if (tagsToRemove && tagsToRemove.length > 0) {
      await supabase
        .from('guest_tags')
        .delete()
        .eq('guest_id', guestId)
        .in('tag_id', tagsToRemove.map(t => t.id))
    }

    await supabase
      .from('guest_tags')
      .upsert(
        { guest_id: guestId, tag_id: tagId },
        { onConflict: 'guest_id,tag_id' }
      )
  }
}

async function saveEventResponses(
  supabase: SupabaseClient,
  guestId: string,
  eventResponses: Record<string, EventResponse>,
  eligibleEvents: ConditionalEvent[]
) {
  for (const event of eligibleEvents) {
    const response = eventResponses[event.id]
    if (!response || response.attending === undefined) continue

    await supabase.from('event_responses').upsert({
      guest_id: guestId,
      event_id: event.id,
      attending: response.attending,
      answers: response.attending ? (response.answers ?? {}) : {},
    }, { onConflict: 'guest_id,event_id' })
  }
}

async function removeEventTag(
  supabase: SupabaseClient,
  guestId: string,
  tagName: string
) {
  const { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('name', tagName)
    .maybeSingle()

  if (!tag) return

  await supabase
    .from('guest_tags')
    .delete()
    .eq('guest_id', guestId)
    .eq('tag_id', tag.id)
}

async function writeSubmission(
  supabase: SupabaseClient,
  s: GuestSubmission,
  guestTags: string[]
) {
  if (s.email) {
    await supabase.from('guests').update({ email: s.email }).eq('id', s.guestId)
  }

  await supabase.from('responses').upsert({
    guest_id: s.guestId,
    attending: s.attending,
    dietary: s.dietary,
    song_request: s.songRequest,
    note: s.note,
  })

  // Save event responses for all eligible events
  const eligibleEvents = ((config.events ?? []) as ConditionalEvent[]).filter(e => guestTags.includes(e.tag))
  await saveEventResponses(supabase, s.guestId, s.eventResponses ?? {}, eligibleEvents)

  // Remove event tags for declined events
  for (const event of eligibleEvents) {
    const eventResponse = s.eventResponses?.[event.id]
    const declined =
      !s.attending || // declined primary event
      (eventResponse && eventResponse.attending === false) // declined this event

    if (declined) {
      await removeEventTag(supabase, s.guestId, event.tag)
    }
  }

  await supabase
    .from('guests')
    .update({ has_responded: true })
    .eq('id', s.guestId)

  await saveCustomAnswers(supabase, s.guestId, s.customAnswers ?? {})
  await applyTagsFromAnswers(
    supabase,
    s.guestId,
    s.customAnswers ?? {},
    config.customQuestions ?? []
  )
}

export async function POST(request: NextRequest) {
  const claims = readGuestClaimsFromRequest(request)
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const rawSubmissions = Array.isArray(body?.submissions) ? body.submissions : null
  if (!rawSubmissions || rawSubmissions.length === 0 || rawSubmissions.length > 50) {
    return NextResponse.json({ error: 'Invalid submissions' }, { status: 400 })
  }

  const submissions: GuestSubmission[] = []
  for (const raw of rawSubmissions) {
    const parsed = parseSubmission(raw)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }
    submissions.push(parsed)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Authorize: every submitted guestId must be the cookie's guest, or
  // share the cookie's group_id for group bookings.
  const targetIds = submissions.map(s => s.guestId)
  const { data: targets, error: targetErr } = await supabase
    .from('guests')
    .select('id, group_id, guest_tags(tags(name))')
    .in('id', targetIds)

  if (targetErr || !targets || targets.length !== targetIds.length) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
  }

  for (const t of targets) {
    const sameGuest = t.id === claims.guestId
    const sameGroup =
      claims.groupId !== null && t.group_id === claims.groupId
    if (!sameGuest && !sameGroup) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  for (const s of submissions) {
    const target = targets.find(t => t.id === s.guestId)
    const guestTags = (target?.guest_tags ?? []).flatMap(
      (gt: { tags: { name: string } | { name: string }[] }) =>
        Array.isArray(gt.tags) ? gt.tags.map(t => t.name) : [gt.tags.name]
    )
    await writeSubmission(supabase, s, guestTags)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('guest_session')
  return response
}
