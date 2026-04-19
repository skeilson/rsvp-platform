import configData from '../config.json'

export type AccessType = 'none' | 'password' | 'token'

export type CustomQuestion = {
  id: string
  label: string
  type: 'choice' | 'text' | 'boolean'
  required: boolean
  showWhen: 'attending' | 'always' | 'secondary'
  options?: string[]
  tagOnAnswer?: Record<string, string>
}

export type EventField = {
  id: string
  label: string
  type: 'choice' | 'text' | 'boolean'
  options?: string[]
  required?: boolean
  tagOnAnswer?: Record<string, string>
}

export type ConditionalEvent = {
  id: string
  name: string
  tag: string
  question: string
  fields?: EventField[]
}

export type AppConfig = typeof configData & {
  access: {
    type: AccessType
    password: string
    token: string
  }
  rsvp: {
    allowChanges: boolean
  }
  customQuestions: CustomQuestion[]
  events: ConditionalEvent[]
}

export const config: AppConfig = configData as AppConfig
