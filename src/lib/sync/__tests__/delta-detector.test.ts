import { DeltaDetector } from '../delta-detector'
import { InChurchMember } from '@/lib/inchurch/types'

describe('DeltaDetector', () => {
  let detector: DeltaDetector

  beforeEach(() => {
    detector = new DeltaDetector()
  })

  const mockExistingRecord = {
    id: 'person-123',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    birth_date: '1990-01-15',
    marital_status: 'single',
    address: '{"street": "Rua A", "city": "São Paulo"}',
    updated_at: '2025-01-01T10:00:00Z'
  }

  const mockInChurchMember: InChurchMember = {
    id: 'member-123',
    name: 'João Silva Santos',
    email: 'joao@example.com',
    phone: '11999999999',
    birthDate: '1990-01-15',
    maritalStatus: 'married',
    address: {
      street: 'Rua B',
      city: 'São Paulo'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2025-01-01T12:00:00Z'
  }

  describe('detectChanges', () => {
    it('should detect name change', () => {
      const changes = detector.detectChanges(mockExistingRecord, mockInChurchMember)
      
      const nameChange = changes.find(c => c.field === 'name')
      expect(nameChange).toBeDefined()
      expect(nameChange!.oldValue).toBe('João Silva')
      expect(nameChange!.newValue).toBe('João Silva Santos')
    })

    it('should detect marital status change', () => {
      const changes = detector.detectChanges(mockExistingRecord, mockInChurchMember)
      
      const statusChange = changes.find(c => c.field === 'maritalStatus')
      expect(statusChange).toBeDefined()
      expect(statusChange!.oldValue).toBe('single')
      expect(statusChange!.newValue).toBe('married')
    })

    it('should detect address change', () => {
      const changes = detector.detectChanges(mockExistingRecord, mockInChurchMember)
      
      const addressChange = changes.find(c => c.field === 'address')
      expect(addressChange).toBeDefined()
    })

    it('should not detect changes for identical values', () => {
      const identicalMember = {
        ...mockInChurchMember,
        name: 'João Silva',
        maritalStatus: 'single',
        address: {
          street: 'Rua A',
          city: 'São Paulo'
        }
      }

      const changes = detector.detectChanges(mockExistingRecord, identicalMember)
      expect(changes).toHaveLength(0)
    })

    it('should handle null/empty values correctly', () => {
      const recordWithNulls = {
        ...mockExistingRecord,
        email: null,
        phone: '',
        address: null
      }

      const memberWithNulls = {
        ...mockInChurchMember,
        email: undefined,
        phone: null,
        address: null
      }

      const changes = detector.detectChanges(recordWithNulls, memberWithNulls)
      
      const emailChange = changes.find(c => c.field === 'email')
      const phoneChange = changes.find(c => c.field === 'phone')
      const addressChange = changes.find(c => c.field === 'address')
      
      expect(emailChange).toBeUndefined()
      expect(phoneChange).toBeUndefined()
      expect(addressChange).toBeUndefined()
    })

    it('should be case insensitive for string comparisons', () => {
      const recordWithUppercase = {
        ...mockExistingRecord,
        name: 'JOÃO SILVA'
      }

      const memberWithLowercase = {
        ...mockInChurchMember,
        name: 'joão silva'
      }

      const changes = detector.detectChanges(recordWithUppercase, memberWithLowercase)
      const nameChange = changes.find(c => c.field === 'name')
      
      expect(nameChange).toBeUndefined()
    })
  })

  describe('calculateChangeSignificance', () => {
    it('should return high significance for critical field changes', () => {
      const criticalChanges = [
        { field: 'maritalStatus', oldValue: 'single', newValue: 'married' }
      ]

      const significance = detector.calculateChangeSignificance(criticalChanges)
      expect(significance).toBe('high')
    })

    it('should return medium significance for moderate field changes', () => {
      const moderateChanges = [
        { field: 'phone', oldValue: '11999999999', newValue: '11888888888' },
        { field: 'email', oldValue: 'old@test.com', newValue: 'new@test.com' }
      ]

      const significance = detector.calculateChangeSignificance(moderateChanges)
      expect(significance).toBe('medium')
    })

    it('should return low significance for minor changes', () => {
      const minorChanges = [
        { field: 'name', oldValue: 'João Silva', newValue: 'João Silva Santos' }
      ]

      const significance = detector.calculateChangeSignificance(minorChanges)
      expect(significance).toBe('low')
    })

    it('should return medium significance for many minor changes', () => {
      const manyChanges = [
        { field: 'name', oldValue: 'João', newValue: 'João Silva' },
        { field: 'birthDate', oldValue: '1990-01-15', newValue: '1990-01-16' },
        { field: 'customField', oldValue: 'old', newValue: 'new' }
      ]

      const significance = detector.calculateChangeSignificance(manyChanges)
      expect(significance).toBe('medium')
    })
  })
})