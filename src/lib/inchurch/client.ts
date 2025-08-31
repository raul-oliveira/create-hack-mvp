import { 
  InChurchConfig, 
  InChurchApiResponse, 
  InChurchMember, 
  InChurchGroup,
  RateLimitInfo 
} from './types'
import { createInChurchError } from './errors'

export class InChurchClient {
  private config: InChurchConfig
  private baseUrl: string
  private requestQueue: Array<() => Promise<unknown>> = []
  private requestCount = 0
  private requestWindowStart = Date.now()
  private readonly MAX_REQUESTS_PER_MINUTE = 200

  constructor(config: InChurchConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.inchurch.com.br'
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<InChurchApiResponse<T>> {
    await this.enforceRateLimit()

    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-API-Secret': this.config.apiSecret,
      ...options.headers,
    }

    const response = await this.fetchWithRetry(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw createInChurchError(response.status, errorBody)
    }

    return response.json()
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        
        if (response.status === 429) {
          if (attempt < maxRetries) {
            await this.exponentialBackoff(attempt)
            continue
          }
        }
        
        return response
      } catch (error) {
        if (attempt < maxRetries) {
          await this.exponentialBackoff(attempt)
          continue
        }
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60 * 1000

    if (now - this.requestWindowStart >= windowDuration) {
      this.requestCount = 0
      this.requestWindowStart = now
    }

    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = windowDuration - (now - this.requestWindowStart)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.requestCount = 0
      this.requestWindowStart = Date.now()
    }

    this.requestCount++
  }

  public getRateLimitInfo(): RateLimitInfo {
    const now = Date.now()
    const windowDuration = 60 * 1000

    return {
      requestsRemaining: Math.max(0, this.MAX_REQUESTS_PER_MINUTE - this.requestCount),
      resetTime: this.requestWindowStart + windowDuration,
      requestsPerMinute: this.MAX_REQUESTS_PER_MINUTE
    }
  }

  public async getMembers(
    page = 1, 
    limit = 50
  ): Promise<InChurchApiResponse<InChurchMember[]>> {
    return this.makeRequest<InChurchMember[]>(
      `/members?page=${page}&limit=${limit}`
    )
  }

  public async getMember(id: string): Promise<InChurchApiResponse<InChurchMember>> {
    return this.makeRequest<InChurchMember>(`/members/${id}`)
  }

  public async updateMember(
    id: string, 
    data: Partial<InChurchMember>
  ): Promise<InChurchApiResponse<InChurchMember>> {
    return this.makeRequest<InChurchMember>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  public async getGroups(): Promise<InChurchApiResponse<InChurchGroup[]>> {
    return this.makeRequest<InChurchGroup[]>('/groups')
  }

  public async getGroup(id: string): Promise<InChurchApiResponse<InChurchGroup>> {
    return this.makeRequest<InChurchGroup>(`/groups/${id}`)
  }

  public async getMembersByGroup(
    groupId: string
  ): Promise<InChurchApiResponse<InChurchMember[]>> {
    return this.makeRequest<InChurchMember[]>(`/groups/${groupId}/members`)
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/health')
      return true
    } catch {
      return false
    }
  }
}

export function createInChurchClient(config: InChurchConfig): InChurchClient {
  return new InChurchClient(config)
}