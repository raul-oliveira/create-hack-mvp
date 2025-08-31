import { InChurchClient } from '../client'
import { InChurchError } from '../errors'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockConfig = {
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
  baseUrl: 'https://api.test.com'
}

describe('InChurchClient', () => {
  let client: InChurchClient

  beforeEach(() => {
    client = new InChurchClient(mockConfig)
    mockFetch.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Authentication', () => {
    it('should include API key and secret in request headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })

      await client.getMembers()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/members?page=1&limit=50',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
            'X-API-Secret': 'test-api-secret',
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw InChurchError for 401 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      })

      await expect(client.getMembers()).rejects.toThrow(InChurchError)
      await expect(client.getMembers()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401
      })
    })

    it('should throw InChurchError for 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      })

      await expect(client.getMembers()).rejects.toThrow(InChurchError)
      await expect(client.getMembers()).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should track requests per minute', () => {
      const rateLimitInfo = client.getRateLimitInfo()
      
      expect(rateLimitInfo.requestsRemaining).toBe(200)
      expect(rateLimitInfo.requestsPerMinute).toBe(200)
      expect(typeof rateLimitInfo.resetTime).toBe('number')
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] })
        })

      const promise = client.getMembers()
      
      jest.advanceTimersByTime(1000)
      jest.advanceTimersByTime(2000)
      
      await promise

      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })

  describe('API Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      })
    })

    it('should get members with pagination', async () => {
      await client.getMembers(2, 25)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/members?page=2&limit=25',
        expect.any(Object)
      )
    })

    it('should get single member by ID', async () => {
      await client.getMember('123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/members/123',
        expect.any(Object)
      )
    })

    it('should update member with PUT request', async () => {
      const updateData = { name: 'Updated Name' }
      await client.updateMember('123', updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/members/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      )
    })

    it('should get groups', async () => {
      await client.getGroups()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/groups',
        expect.any(Object)
      )
    })

    it('should get members by group', async () => {
      await client.getMembersByGroup('group-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/groups/group-123/members',
        expect.any(Object)
      )
    })

    it('should test connection', async () => {
      const isConnected = await client.testConnection()
      
      expect(isConnected).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/health',
        expect.any(Object)
      )
    })
  })
})