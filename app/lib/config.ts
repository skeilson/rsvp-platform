import configData from '../config.json'

export type AppConfig = typeof configData

export const config: AppConfig = configData
