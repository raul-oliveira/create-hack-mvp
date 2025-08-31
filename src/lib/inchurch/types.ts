export interface InChurchConfig {
  apiKey: string
  apiSecret: string
  baseUrl?: string
}

export interface InChurchMember {
  id: string
  name: string
  email?: string
  phone?: string
  birthDate?: string
  maritalStatus?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
  }
  groups?: string[]
  customFields?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface InChurchGroup {
  id: string
  name: string
  description?: string
  leaderId?: string
  members?: string[]
  createdAt: string
  updatedAt: string
}

export interface InChurchWebhookEvent {
  id: string
  type: 'member.created' | 'member.updated' | 'member.deleted' | 'group.updated'
  data: InChurchMember | InChurchGroup
  timestamp: string
  organizationId: string
}

export interface InChurchApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface InChurchApiError extends Error {
  code: string
  status?: number
  details?: unknown
}

export interface RateLimitInfo {
  requestsRemaining: number
  resetTime: number
  requestsPerMinute: number
}