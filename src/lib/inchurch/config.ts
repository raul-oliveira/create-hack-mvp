import { InChurchConfig } from './types'

const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const getInChurchConfig = (): InChurchConfig => {
  return {
    apiKey: getRequiredEnvVar('INCHURCH_API_KEY'),
    apiSecret: getRequiredEnvVar('INCHURCH_API_SECRET'),
    baseUrl: process.env.INCHURCH_API_URL || 'https://api.inchurch.com.br/v1',
  }
}

export const RATE_LIMIT_CONFIG = {
  requests: parseInt(process.env.INCHURCH_RATE_LIMIT_REQUESTS || '60'),
  window: parseInt(process.env.INCHURCH_RATE_LIMIT_WINDOW || '60000'), // 1 minute
}

export const REQUEST_CONFIG = {
  timeout: parseInt(process.env.INCHURCH_REQUEST_TIMEOUT || '10000'), // 10 seconds
  retries: parseInt(process.env.INCHURCH_MAX_RETRIES || '3'),
}

export const CACHE_CONFIG = {
  ttl: parseInt(process.env.INCHURCH_CACHE_TTL || '300000'), // 5 minutes
  maxKeys: parseInt(process.env.INCHURCH_CACHE_MAX_KEYS || '1000'),
}