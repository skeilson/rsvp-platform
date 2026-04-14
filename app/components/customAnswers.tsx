import { supabase } from '@/lib/supabase'

export async function saveCustomAnswers(
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
