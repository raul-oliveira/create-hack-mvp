import axios, { AxiosInstance, AxiosResponse } from 'axios'
import NodeCache from 'node-cache'
import { backOff } from 'exponential-backoff'
import { 
  InChurchConfig, 
  InChurchApiResponse,
  InChurchMember,
  InChurchGroup,
  RateLimitInfo 
} from './types'
import { InChurchError, createInChurchError } from './errors'
import { getInChurchConfig, RATE_LIMIT_CONFIG, REQUEST_CONFIG, CACHE_CONFIG } from './config'

export class InChurchApiClient {
  private client: AxiosInstance
  private cache: NodeCache
  private rateLimitInfo: RateLimitInfo | null = null

  constructor(config?: Partial<InChurchConfig>) {
    const fullConfig = { ...getInChurchConfig(), ...config }
    
    this.cache = new NodeCache({
      stdTTL: CACHE_CONFIG.ttl / 1000, // Convert to seconds
      maxKeys: CACHE_CONFIG.maxKeys,
      useClones: false
    })

    this.client = axios.create({
      baseURL: fullConfig.baseUrl,
      timeout: REQUEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Church-Leader-Assistant/1.0',
      },
    })

    // Setup request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${fullConfig.apiKey}`
        config.headers['X-API-Secret'] = fullConfig.apiSecret
        return config
      },
      (error) => Promise.reject(error)
    )

    // Setup response interceptor for error handling and rate limit tracking
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers
        this.updateRateLimitInfo(response)
        return response
      },
      (error) => {
        if (error.response) {
          this.updateRateLimitInfo(error.response)
          throw createInChurchError(error.response.status, error.response.data)
        }
        throw new InChurchError('Network error', 'NETWORK_ERROR', undefined, error.message)
      }
    )
  }

  private updateRateLimitInfo(response: AxiosResponse) {
    const headers = response.headers
    if (headers['x-ratelimit-remaining']) {
      this.rateLimitInfo = {
        requestsRemaining: parseInt(headers['x-ratelimit-remaining']),
        resetTime: parseInt(headers['x-ratelimit-reset']) * 1000, // Convert to ms
        requestsPerMinute: parseInt(headers['x-ratelimit-limit'] || '60')
      }
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    useCache = true
  ): Promise<T> {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`
    
    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cached = this.cache.get<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check rate limits before making request
    if (this.rateLimitInfo && this.rateLimitInfo.requestsRemaining <= 0) {
      const waitTime = Math.max(0, this.rateLimitInfo.resetTime - Date.now())
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // Make request with retry logic
    const response = await backOff(
      async () => {
        switch (method) {
          case 'GET':
            return this.client.get(endpoint)
          case 'POST':
            return this.client.post(endpoint, data)
          case 'PUT':
            return this.client.put(endpoint, data)
          case 'DELETE':
            return this.client.delete(endpoint)
        }
      },
      {
        numOfAttempts: REQUEST_CONFIG.retries,
        startingDelay: 1000,
        maxDelay: 10000,
        delayFirstAttempt: false,
        retry: (error: any) => {
          // Retry on network errors and 5xx errors
          return !error.response || error.response.status >= 500
        }
      }
    )

    const result = response.data as InChurchApiResponse<T>
    
    if (!result.success && result.error) {
      throw new InChurchError(
        result.error.message,
        result.error.code,
        response.status,
        result.error.details
      )
    }

    const data_result = result.data as T
    
    // Cache successful GET responses
    if (method === 'GET' && useCache && data_result) {
      this.cache.set(cacheKey, data_result)
    }

    return data_result
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest('GET', '/health', undefined, false)
  }

  // Organization methods
  async getOrganization(organizationId: string): Promise<any> {
    return this.makeRequest('GET', `/organizations/${organizationId}`)
  }

  // Member methods
  async getMembers(
    organizationId: string, 
    filters: {
      page?: number
      limit?: number
      updatedAfter?: string
      updatedBefore?: string
      status?: 'active' | 'inactive' | 'pending' | 'all'
      groupIds?: string[]
      search?: string
    } = {}
  ): Promise<{
    members: InChurchMember[]
    pagination: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
  }> {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v))
        } else {
          queryParams.set(key, value.toString())
        }
      }
    })

    const endpoint = `/organizations/${organizationId}/members?${queryParams.toString()}`
    return this.makeRequest('GET', endpoint)
  }

  async getMember(organizationId: string, memberId: string): Promise<InChurchMember> {
    return this.makeRequest('GET', `/organizations/${organizationId}/members/${memberId}`)
  }

  async createMember(organizationId: string, memberData: Partial<InChurchMember>): Promise<InChurchMember> {
    return this.makeRequest('POST', `/organizations/${organizationId}/members`, memberData, false)
  }

  async updateMember(
    organizationId: string, 
    memberId: string, 
    memberData: Partial<InChurchMember>
  ): Promise<InChurchMember> {
    return this.makeRequest('PUT', `/organizations/${organizationId}/members/${memberId}`, memberData, false)
  }

  async deleteMember(organizationId: string, memberId: string): Promise<void> {
    await this.makeRequest('DELETE', `/organizations/${organizationId}/members/${memberId}`, undefined, false)
  }

  // Group methods
  async getGroups(organizationId: string): Promise<InChurchGroup[]> {
    return this.makeRequest('GET', `/organizations/${organizationId}/groups`)
  }

  async getGroup(organizationId: string, groupId: string): Promise<InChurchGroup> {
    return this.makeRequest('GET', `/organizations/${organizationId}/groups/${groupId}`)
  }

  async createGroup(organizationId: string, groupData: Partial<InChurchGroup>): Promise<InChurchGroup> {
    return this.makeRequest('POST', `/organizations/${organizationId}/groups`, groupData, false)
  }

  async updateGroup(
    organizationId: string, 
    groupId: string, 
    groupData: Partial<InChurchGroup>
  ): Promise<InChurchGroup> {
    return this.makeRequest('PUT', `/organizations/${organizationId}/groups/${groupId}`, groupData, false)
  }

  async deleteGroup(organizationId: string, groupId: string): Promise<void> {
    await this.makeRequest('DELETE', `/organizations/${organizationId}/groups/${groupId}`, undefined, false)
  }

  // Utility methods
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo
  }

  clearCache(): void {
    this.cache.flushAll()
  }

  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats()
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    }
  }
}

// Singleton instance
let inChurchClient: InChurchApiClient | null = null

export const getInChurchClient = (config?: Partial<InChurchConfig>): InChurchApiClient => {
  if (!inChurchClient || config) {
    inChurchClient = new InChurchApiClient(config)
  }
  return inChurchClient
}