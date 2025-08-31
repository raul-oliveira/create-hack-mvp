import { z } from 'zod'

// Address schema for nested validation
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional().default('Brasil')
})

// Custom validation for phone numbers (Brazilian format)
const PhoneSchema = z.string()
  .regex(/^\+?55?\d{10,11}$/, 'Formato de telefone inválido')
  .optional()
  .or(z.literal(''))
  .transform(val => val === '' ? null : val)

// Email validation with sanitization
const EmailSchema = z.string()
  .email('Email inválido')
  .toLowerCase()
  .optional()
  .or(z.literal(''))
  .transform(val => val === '' ? null : val)

// Date validation for birth dates
const BirthDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine(date => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 0 && age <= 120
  }, 'Data de nascimento inválida')
  .optional()

// Marital status validation
const MaritalStatusSchema = z.enum([
  'single',
  'married', 
  'divorced',
  'widowed',
  'separated',
  'engaged'
]).optional()

// Profile data with flexible structure but type safety
export const ProfileDataSchema = z.object({
  occupation: z.string().optional(),
  education: z.string().optional(),
  interests: z.array(z.string()).optional(),
  ministries: z.array(z.string()).optional(),
  baptized: z.boolean().optional(),
  memberSince: z.string().optional(),
  notes: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional()
}).strict()

// Main Person schema for validation
export const PersonSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome não pode exceder 255 caracteres')
    .transform(val => val.trim()),
  
  email: EmailSchema,
  phone: PhoneSchema,
  birth_date: BirthDateSchema,
  marital_status: MaritalStatusSchema,
  address: AddressSchema.optional(),
  profile_data: ProfileDataSchema.optional(),
  
  // System fields
  organization_id: z.string().uuid('ID da organização inválido'),
  leader_id: z.string().uuid('ID do líder inválido'),
  inchurch_member_id: z.string().optional(),
  sync_source: z.enum(['manual', 'webhook', 'daily_polling']).default('manual')
})

// Person creation schema (excludes system-generated fields)
export const CreatePersonSchema = PersonSchema.omit({
  organization_id: true,
  leader_id: true
})

// Person update schema (all fields optional except name)
export const UpdatePersonSchema = PersonSchema.partial().extend({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome não pode exceder 255 caracteres')
    .transform(val => val.trim())
})

// InChurch member validation schema
export const InChurchMemberSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: AddressSchema.optional(),
  groups: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// Change detection schema
export const PersonChangeSchema = z.object({
  person_id: z.string().uuid(),
  change_type: z.string(),
  old_value: z.unknown().optional(),
  new_value: z.unknown(),
  detected_at: z.string().datetime(),
  urgency_score: z.number().min(1).max(10).default(5),
  ai_analysis: z.object({
    significance: z.enum(['low', 'medium', 'high']),
    recommended_actions: z.array(z.string()),
    context: z.string().optional()
  }).optional()
})

// Data sanitization utilities
export class DataSanitizer {
  static sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[^\p{L}\s\-']/gu, '') // Only letters, spaces, hyphens, apostrophes
      .slice(0, 255)
  }

  static sanitizePhone(phone: string): string | null {
    if (!phone) return null
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Handle Brazilian phone formats
    if (digits.length === 11 && digits.startsWith('55')) {
      return `+${digits}`
    }
    
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`
    }
    
    return null
  }

  static sanitizeEmail(email: string): string | null {
    if (!email) return null
    
    const sanitized = email.toLowerCase().trim()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(sanitized) ? sanitized : null
  }

  static sanitizeAddress(address: unknown): Record<string, unknown> | null {
    if (!address || typeof address !== 'object') return null
    
    try {
      return AddressSchema.parse(address)
    } catch {
      return null
    }
  }
}

// Validation error handling
export class ValidationError extends Error {
  public errors: z.ZodError

  constructor(errors: z.ZodError) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }

  getFormattedErrors(): Record<string, string[]> {
    return this.errors.errors.reduce((acc, error) => {
      const field = error.path.join('.')
      if (!acc[field]) acc[field] = []
      acc[field].push(error.message)
      return acc
    }, {} as Record<string, string[]>)
  }
}

// Type exports for use throughout the application
export type Person = z.infer<typeof PersonSchema>
export type CreatePerson = z.infer<typeof CreatePersonSchema>
export type UpdatePerson = z.infer<typeof UpdatePersonSchema>
export type PersonChange = z.infer<typeof PersonChangeSchema>
export type InChurchMember = z.infer<typeof InChurchMemberSchema>
export type Address = z.infer<typeof AddressSchema>
export type ProfileData = z.infer<typeof ProfileDataSchema>