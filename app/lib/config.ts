import configData from '../config.json'

export type AccessType = 'none' | 'password' | 'token'

export type CustomQuestion = {
  id: string
  label: string
  type: 'choice' | 'text' | 'boolean'
  required: boolean
  showWhen: 'attending' | 'always' | 'secondary'
  options?: string[]
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
}

export const config: AppConfig = configData as AppConfig
