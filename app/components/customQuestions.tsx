import { CustomQuestion } from '@/lib/config'

type Props = {
  questions: CustomQuestion[]
  answers: Record<string, string>
  onChange: (questionId: string, answer: string) => void
  showWhen: 'attending' | 'always' | 'secondary'
}

export default function CustomQuestions({ questions, answers, onChange, showWhen }: Props) {
  const filtered = questions.filter(q => q.showWhen === showWhen)

  if (filtered.length === 0) return null

  return (
    <div className="space-y-6">
      {filtered.map(question => (
        <div key={question.id} className="space-y-3">
          <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
            {question.label}
            {question.required && (
              <span style={{ color: 'var(--color-accent)' }}> *</span>
            )}
          </p>

          {question.type === 'choice' && question.options && (
            <div className="space-y-2">
              {question.options.map(option => (
                <button
                  key={option}
                  onClick={() => onChange(question.id, option)}
                  className="w-full py-3 px-4 rounded-lg border text-left text-base font-medium"
                  style={
                    answers[question.id] === option
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-background)',
                          borderColor: 'var(--color-primary)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          opacity: 0.5,
                        }
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.type === 'text' && (
            <input
              type="text"
              value={answers[question.id] ?? ''}
              onChange={e => onChange(question.id, e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={{
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                backgroundColor: 'transparent',
                opacity: 0.8,
              }}
            />
          )}

          {question.type === 'boolean' && (
            <div className="flex gap-4">
              {['Yes', 'No'].map(option => (
                <button
                  key={option}
                  onClick={() => onChange(question.id, option)}
                  className="flex-1 py-3 rounded-lg border font-medium"
                  style={
                    answers[question.id] === option
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-background)',
                          borderColor: 'var(--color-primary)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          opacity: 0.5,
                        }
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
