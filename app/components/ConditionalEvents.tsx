import { ConditionalEvent } from '@/lib/config'

type EventResponse = {
  attending: boolean | null
  answers: Record<string, string>
}

type Props = {
  events: ConditionalEvent[]
  guestTags: string[]
  responses: Record<string, EventResponse>
  onChange: (eventId: string, field: 'attending', value: boolean) => void
  onAnswerChange: (eventId: string, fieldId: string, value: string) => void
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

const inputStyle = {
  border: '1px solid var(--color-primary)',
  color: 'var(--color-primary)',
  backgroundColor: 'transparent',
  opacity: 0.8,
}

export default function ConditionalEvents({
  events,
  guestTags,
  responses,
  onChange,
  onAnswerChange,
}: Props) {
  const eligibleEvents = events.filter(e => guestTags.includes(e.tag))

  if (eligibleEvents.length === 0) return null

  return (
    <div className="space-y-8">
      {eligibleEvents.map(event => {
        const response = responses[event.id] ?? { attending: null, answers: {} }

        return (
          <div
            key={event.id}
            className="space-y-4 pt-6"
            style={{ borderTop: '1px solid var(--color-primary)' }}
          >
            <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
              {event.question}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => onChange(event.id, 'attending', true)}
                className="flex-1 py-3 rounded-lg border font-medium"
                style={response.attending === true ? buttonActiveStyle : buttonInactiveStyle}
              >
                Yes
              </button>
              <button
                onClick={() => onChange(event.id, 'attending', false)}
                className="flex-1 py-3 rounded-lg border font-medium"
                style={response.attending === false ? buttonActiveStyle : buttonInactiveStyle}
              >
                No
              </button>
            </div>

            {response.attending === true && event.fields && event.fields.length > 0 && (
              <div className="space-y-4 pt-2">
                {event.fields.filter(field => {
                    if (!field.showWhenField) return true
                    return response.answers[field.showWhenField] === field.showWhenValue
                }).map(field => ( 
                  <div key={field.id} className="space-y-2">
                    <p className="font-medium" style={{ color: 'var(--color-primary)' }}>
                      {field.label}
                      {field.required && (
                        <span style={{ color: 'var(--color-accent)' }}> *</span>
                      )}
                    </p>

                    {field.type === 'choice' && field.options && (
                      <div className="space-y-2">
                        {field.options.map(option => (
                          <button
                            key={option}
                            onClick={() => onAnswerChange(event.id, field.id, option)}
                            className="w-full py-3 px-4 rounded-lg border text-left text-base font-medium"
                            style={
                              response.answers[field.id] === option
                                ? buttonActiveStyle
                                : buttonInactiveStyle
                            }
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ))}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={response.answers[field.id] ?? ''}
                        onChange={e => onAnswerChange(event.id, field.id, e.target.value)}
                        className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2"
                        style={inputStyle}
                      />
                    )}

                    {field.type === 'boolean' && (
                      <div className="flex gap-4">
                        {['Yes', 'No'].map(option => (
                          <button
                            key={option}
                            onClick={() => onAnswerChange(event.id, field.id, option)}
                            className="flex-1 py-3 rounded-lg border font-medium"
                            style={
                              response.answers[field.id] === option
                                ? buttonActiveStyle
                                : buttonInactiveStyle
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
            )}
          </div>
        )
      })}
    </div>
  )
}
