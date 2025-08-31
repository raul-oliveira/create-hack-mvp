import { PersonSchema, CreatePersonSchema, DataSanitizer, ValidationError } from '../people'
import { z } from 'zod'

describe('People Schema Validation', () => {
  describe('PersonSchema', () => {
    const validPersonData = {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      birth_date: '1990-01-15',
      marital_status: 'single' as const,
      address: {
        street: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      organization_id: '123e4567-e89b-12d3-a456-426614174000',
      leader_id: '123e4567-e89b-12d3-a456-426614174001',
      sync_source: 'manual' as const
    }

    it('should validate a complete valid person', () => {
      const result = PersonSchema.parse(validPersonData)
      expect(result.name).toBe('João Silva')
      expect(result.email).toBe('joao@example.com')
      expect(result.sync_source).toBe('manual')
    })

    it('should require name field', () => {
      const invalidData = { ...validPersonData }
      delete invalidData.name

      expect(() => PersonSchema.parse(invalidData)).toThrow()
    })

    it('should validate email format', () => {
      const invalidEmailData = { ...validPersonData, email: 'invalid-email' }
      
      expect(() => PersonSchema.parse(invalidEmailData)).toThrow()
    })

    it('should validate phone number format', () => {
      const validPhoneData = { ...validPersonData, phone: '11999999999' }
      const result = PersonSchema.parse(validPhoneData)
      expect(result.phone).toBe('11999999999')

      const invalidPhoneData = { ...validPersonData, phone: 'invalid-phone' }
      expect(() => PersonSchema.parse(invalidPhoneData)).toThrow()
    })

    it('should validate birth date format', () => {
      const validBirthData = { ...validPersonData, birth_date: '1990-12-25' }
      const result = PersonSchema.parse(validBirthData)
      expect(result.birth_date).toBe('1990-12-25')

      const invalidBirthData = { ...validPersonData, birth_date: '25/12/1990' }
      expect(() => PersonSchema.parse(invalidBirthData)).toThrow()
    })

    it('should validate marital status enum', () => {
      const validStatuses = ['single', 'married', 'divorced', 'widowed', 'separated', 'engaged']
      
      for (const status of validStatuses) {
        const data = { ...validPersonData, marital_status: status }
        const result = PersonSchema.parse(data)
        expect(result.marital_status).toBe(status)
      }

      const invalidStatusData = { ...validPersonData, marital_status: 'invalid-status' }
      expect(() => PersonSchema.parse(invalidStatusData)).toThrow()
    })

    it('should handle optional fields', () => {
      const minimalData = {
        name: 'João Silva',
        organization_id: validPersonData.organization_id,
        leader_id: validPersonData.leader_id,
        sync_source: 'manual' as const
      }

      const result = PersonSchema.parse(minimalData)
      expect(result.name).toBe('João Silva')
      expect(result.email).toBeUndefined()
      expect(result.phone).toBeUndefined()
    })

    it('should trim and sanitize name', () => {
      const dataWithExtraSpaces = {
        ...validPersonData,
        name: '  João Silva  '
      }

      const result = PersonSchema.parse(dataWithExtraSpaces)
      expect(result.name).toBe('João Silva')
    })

    it('should convert empty strings to null for optional fields', () => {
      const dataWithEmptyStrings = {
        ...validPersonData,
        email: '',
        phone: ''
      }

      const result = PersonSchema.parse(dataWithEmptyStrings)
      expect(result.email).toBeNull()
      expect(result.phone).toBeNull()
    })
  })

  describe('CreatePersonSchema', () => {
    it('should exclude system fields', () => {
      const createData = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999'
      }

      const result = CreatePersonSchema.parse(createData)
      expect(result.name).toBe('João Silva')
      expect(result).not.toHaveProperty('organization_id')
      expect(result).not.toHaveProperty('leader_id')
    })
  })

  describe('DataSanitizer', () => {
    describe('sanitizeName', () => {
      it('should trim whitespace', () => {
        expect(DataSanitizer.sanitizeName('  João Silva  ')).toBe('João Silva')
      })

      it('should normalize multiple spaces', () => {
        expect(DataSanitizer.sanitizeName('João    Silva')).toBe('João Silva')
      })

      it('should remove invalid characters', () => {
        expect(DataSanitizer.sanitizeName('João123Silva')).toBe('JoãoSilva')
      })

      it('should preserve hyphens and apostrophes', () => {
        expect(DataSanitizer.sanitizeName("Mary-Anne O'Connor")).toBe("Mary-Anne O'Connor")
      })

      it('should truncate long names', () => {
        const longName = 'A'.repeat(300)
        const result = DataSanitizer.sanitizeName(longName)
        expect(result.length).toBe(255)
      })
    })

    describe('sanitizePhone', () => {
      it('should format Brazilian phone numbers', () => {
        expect(DataSanitizer.sanitizePhone('11999999999')).toBe('+5511999999999')
        expect(DataSanitizer.sanitizePhone('(11) 99999-9999')).toBe('+5511999999999')
        expect(DataSanitizer.sanitizePhone('+55 11 99999-9999')).toBe('+5511999999999')
      })

      it('should handle numbers with country code', () => {
        expect(DataSanitizer.sanitizePhone('5511999999999')).toBe('+5511999999999')
      })

      it('should return null for invalid phones', () => {
        expect(DataSanitizer.sanitizePhone('123')).toBeNull()
        expect(DataSanitizer.sanitizePhone('')).toBeNull()
        expect(DataSanitizer.sanitizePhone('invalid')).toBeNull()
      })
    })

    describe('sanitizeEmail', () => {
      it('should normalize email to lowercase', () => {
        expect(DataSanitizer.sanitizeEmail('João@EXAMPLE.COM')).toBe('joão@example.com')
      })

      it('should trim whitespace', () => {
        expect(DataSanitizer.sanitizeEmail('  joao@example.com  ')).toBe('joao@example.com')
      })

      it('should return null for invalid emails', () => {
        expect(DataSanitizer.sanitizeEmail('invalid-email')).toBeNull()
        expect(DataSanitizer.sanitizeEmail('')).toBeNull()
        expect(DataSanitizer.sanitizeEmail('user@')).toBeNull()
      })
    })

    describe('sanitizeAddress', () => {
      it('should validate and return valid address objects', () => {
        const validAddress = {
          street: 'Rua A, 123',
          city: 'São Paulo',
          state: 'SP'
        }

        const result = DataSanitizer.sanitizeAddress(validAddress)
        expect(result).toEqual(validAddress)
      })

      it('should return null for invalid addresses', () => {
        expect(DataSanitizer.sanitizeAddress('invalid')).toBeNull()
        expect(DataSanitizer.sanitizeAddress(null)).toBeNull()
        expect(DataSanitizer.sanitizeAddress(undefined)).toBeNull()
      })
    })
  })

  describe('ValidationError', () => {
    it('should format Zod errors correctly', () => {
      try {
        PersonSchema.parse({
          name: '',
          organization_id: 'invalid-uuid',
          leader_id: 'invalid-uuid'
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationError = new ValidationError(error)
          const formattedErrors = validationError.getFormattedErrors()
          
          expect(formattedErrors).toHaveProperty('name')
          expect(formattedErrors).toHaveProperty('organization_id')
          expect(formattedErrors).toHaveProperty('leader_id')
        }
      }
    })
  })
})