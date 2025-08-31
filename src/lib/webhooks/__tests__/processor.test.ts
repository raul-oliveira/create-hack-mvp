import { WebhookProcessor } from '../processor'
import { InChurchWebhookEvent } from '@/lib/inchurch/types'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn()
        }))
      })),
      upsert: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn()
        }))
      }))
    }))
  }))
}))

describe('WebhookProcessor', () => {
  let processor: WebhookProcessor
  let mockSupabase: Record<string, unknown>

  beforeEach(() => {
    processor = new WebhookProcessor()
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        })),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null }),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null })
          }))
        }))
      }))
    }
    
    ;(processor as unknown as { supabase: Record<string, unknown> }).supabase = mockSupabase
  })

  describe('processEvent', () => {
    const mockEvent: InChurchWebhookEvent = {
      id: 'event-123',
      type: 'member.created',
      data: {
        id: 'member-123',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      timestamp: '2025-01-01T00:00:00Z',
      organizationId: 'org-123'
    }

    it('should process member.created event', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn()
              .mockResolvedValueOnce({ data: { id: 'org-123' }, error: null })
              .mockResolvedValueOnce({ data: { id: 'leader-123' }, error: null })
          }))
        })),
        upsert: jest.fn().mockResolvedValue({ error: null })
      })

      const result = await processor.processEvent(mockEvent)
      expect(result).toBe(true)
    })

    it('should process member.updated event and create change record', async () => {
      const updatedEvent = { ...mockEvent, type: 'member.updated' as const }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn()
              .mockResolvedValueOnce({ data: { id: 'org-123' }, error: null })
              .mockResolvedValueOnce({ data: { id: 'leader-123' }, error: null })
              .mockResolvedValueOnce({ data: { id: 'person-123' }, error: null })
          }))
        })),
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      const result = await processor.processEvent(updatedEvent)
      expect(result).toBe(true)
    })

    it('should process member.deleted event', async () => {
      const deletedEvent = { ...mockEvent, type: 'member.deleted' as const }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn()
              .mockResolvedValueOnce({ data: { id: 'person-123' }, error: null })
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null })
          }))
        })),
        insert: jest.fn().mockResolvedValue({ error: null })
      })

      const result = await processor.processEvent(deletedEvent)
      expect(result).toBe(true)
    })

    it('should skip duplicate events', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            contains: jest.fn(() => ({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'log-123' }, error: null })
            }))
          }))
        }))
      })

      const result = await processor.processEvent(mockEvent)
      expect(result).toBe(true)
    })

    it('should handle unknown event types', async () => {
      const unknownEvent = { ...mockEvent, type: 'unknown.event' as const }
      
      const result = await processor.processEvent(unknownEvent)
      expect(result).toBe(false)
    })
  })

  describe('calculateUrgencyScore', () => {
    it('should assign high urgency to deleted members', () => {
      const score = (processor as unknown as { calculateUrgencyScore: (type: string, value: unknown) => number }).calculateUrgencyScore('member.deleted', {})
      expect(score).toBe(9)
    })

    it('should assign medium urgency to marital status changes', () => {
      const score = (processor as unknown as { calculateUrgencyScore: (type: string, value: unknown) => number }).calculateUrgencyScore('member.updated', { maritalStatus: 'married' })
      expect(score).toBe(7)
    })

    it('should assign low urgency to contact info changes', () => {
      const score = (processor as unknown as { calculateUrgencyScore: (type: string, value: unknown) => number }).calculateUrgencyScore('member.updated', { phone: '11999999999' })
      expect(score).toBe(5)
    })

    it('should assign moderate urgency to new members', () => {
      const score = (processor as unknown as { calculateUrgencyScore: (type: string, value: unknown) => number }).calculateUrgencyScore('member.created', {})
      expect(score).toBe(6)
    })
  })
})