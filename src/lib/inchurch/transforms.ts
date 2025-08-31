import { InChurchMember, InChurchGroup } from './types'
import { Person } from '@/lib/schemas/people'

/**
 * Transform InChurch member data to our internal Person schema
 */
export function transformInChurchMemberToPerson(
  member: InChurchMember,
  organizationId: string,
  leaderId: string
): Omit<Person, 'id'> {
  return {
    name: member.name,
    email: member.email || null,
    phone: normalizePhoneNumber(member.phone),
    birth_date: member.birthDate ? new Date(member.birthDate) : null,
    organization_id: organizationId,
    leader_id: leaderId,
    sync_source: 'inchurch' as const,
    external_id: member.id,
    last_synced_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    // Map custom fields that might contain additional data
    ...(member.customFields && {
      // Extract common custom fields if they exist
      ...(member.customFields.address && {
        // Address handling could be extended here
      })
    })
  }
}

/**
 * Transform our internal Person data to InChurch member format
 */
export function transformPersonToInChurchMember(person: Person): Partial<InChurchMember> {
  return {
    name: person.name,
    email: person.email || undefined,
    phone: person.phone || undefined,
    birthDate: person.birth_date ? person.birth_date.toISOString().split('T')[0] : undefined,
    // Add other fields as needed based on InChurch API requirements
  }
}

/**
 * Normalize phone number to Brazilian format
 */
export function normalizePhoneNumber(phone?: string): string | null {
  if (!phone) return null
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Handle Brazilian phone numbers
  if (digits.length === 11 && digits.startsWith('55')) {
    // Already has country code
    return `+${digits}`
  } else if (digits.length === 11) {
    // Add country code
    return `+55${digits}`
  } else if (digits.length === 10) {
    // Add country code and assume mobile (9 in front)
    return `+559${digits}`
  } else if (digits.length === 9) {
    // Local mobile number, add area code (this would need to be configurable)
    // For now, assume São Paulo area code (11)
    return `+5511${digits}`
  } else if (digits.length === 8) {
    // Local landline, add area code and mobile prefix
    return `+55119${digits}`
  }
  
  // Return as-is if can't normalize
  return phone
}

/**
 * Normalize email address
 */
export function normalizeEmail(email?: string): string | null {
  if (!email) return null
  
  const normalized = email.toLowerCase().trim()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(normalized)) {
    return null
  }
  
  return normalized
}

/**
 * Extract changes between two InChurch member records
 */
export function extractMemberChanges(
  oldMember: InChurchMember,
  newMember: InChurchMember
): Array<{
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'modified' | 'removed'
}> {
  const changes: Array<{
    field: string
    oldValue: any
    newValue: any
    changeType: 'added' | 'modified' | 'removed'
  }> = []

  const fieldsToCheck = [
    'name', 'email', 'phone', 'birthDate', 'maritalStatus', 
    'address', 'groups', 'status'
  ] as const

  for (const field of fieldsToCheck) {
    const oldValue = oldMember[field]
    const newValue = newMember[field]

    // Deep comparison for objects and arrays
    const oldStr = typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue
    const newStr = typeof newValue === 'object' ? JSON.stringify(newValue) : newValue

    if (oldStr !== newStr) {
      let changeType: 'added' | 'modified' | 'removed'
      
      if (!oldValue && newValue) {
        changeType = 'added'
      } else if (oldValue && !newValue) {
        changeType = 'removed'
      } else {
        changeType = 'modified'
      }

      changes.push({
        field,
        oldValue,
        newValue,
        changeType
      })
    }
  }

  return changes
}

/**
 * Generate a human-readable description of member changes
 */
export function describeMemberChanges(
  changes: Array<{
    field: string
    oldValue: any
    newValue: any
    changeType: 'added' | 'modified' | 'removed'
  }>
): string[] {
  return changes.map(change => {
    const fieldNames: Record<string, string> = {
      name: 'nome',
      email: 'email',
      phone: 'telefone',
      birthDate: 'data de nascimento',
      maritalStatus: 'estado civil',
      address: 'endereço',
      groups: 'grupos',
      status: 'status'
    }

    const fieldName = fieldNames[change.field] || change.field

    switch (change.changeType) {
      case 'added':
        return `${fieldName} adicionado: ${formatValue(change.newValue)}`
      case 'removed':
        return `${fieldName} removido: ${formatValue(change.oldValue)}`
      case 'modified':
        return `${fieldName} alterado de "${formatValue(change.oldValue)}" para "${formatValue(change.newValue)}"`
    }
  })
}

/**
 * Format a value for display in change descriptions
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '(vazio)'
  }
  
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  
  if (typeof value === 'object') {
    // Special handling for address objects
    if (value.street || value.city) {
      const parts = [value.street, value.city, value.state].filter(Boolean)
      return parts.join(', ')
    }
    return JSON.stringify(value)
  }
  
  return String(value)
}

/**
 * Validate InChurch member data before transformation
 */
export function validateInChurchMember(member: any): member is InChurchMember {
  return (
    typeof member === 'object' &&
    member !== null &&
    typeof member.id === 'string' &&
    typeof member.name === 'string' &&
    typeof member.createdAt === 'string' &&
    typeof member.updatedAt === 'string'
  )
}

/**
 * Batch transform multiple InChurch members
 */
export function transformInChurchMembersBatch(
  members: InChurchMember[],
  organizationId: string,
  leaderId: string
): Array<Omit<Person, 'id'>> {
  return members
    .filter(validateInChurchMember)
    .map(member => transformInChurchMemberToPerson(member, organizationId, leaderId))
}