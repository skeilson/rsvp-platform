import configData from '../config.json'

export type AccessType = 'none' | 'password' | 'token'

export type AppConfig = typeof configData & {
  access: {
    type: AccessType
    password: string
    token: string
  }
}

export const config: AppConfig = configData as AppConfig
