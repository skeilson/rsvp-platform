import { supabase } from '@/lib/supabase'
import { CustomQuestion } from '@/lib/config'

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

export async function applyTagsFromAnswers(
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

    // Ensure the tag exists
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single()

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

    // Remove any existing tags from this question's tagOnAnswer values
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

    // Apply the new tag
    await supabase.from('guest_tags').upsert({
      guest_id: guestId,
      tag_id: tagId,
    }, { onConflict: 'guest_id,tag_id' })
  }
}
