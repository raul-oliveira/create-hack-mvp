import { InChurchMember } from '@/lib/inchurch/types'

export interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export class DeltaDetector {
  private readonly TRACKED_FIELDS = [
    'name',
    'email', 
    'phone',
    'birthDate',
    'maritalStatus',
    'address'
  ]

  detectChanges(
    existingRecord: Record<string, unknown>,
    inchurchMember: InChurchMember
  ): FieldChange[] {
    const changes: FieldChange[] = []

    for (const field of this.TRACKED_FIELDS) {
      const oldValue = this.getFieldValue(existingRecord, field)
      const newValue = this.getInChurchFieldValue(inchurchMember, field)

      if (this.hasFieldChanged(oldValue, newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        })
      }
    }

    return changes
  }

  private getFieldValue(record: Record<string, unknown>, field: string): unknown {
    switch (field) {
      case 'name':
        return record.name
      case 'email':
        return record.email
      case 'phone':
        return record.phone
      case 'birthDate':
        return record.birth_date
      case 'maritalStatus':
        return record.marital_status
      case 'address':
        return record.address ? this.parseJsonSafely(record.address) : null
      default:
        return null
    }
  }

  private getInChurchFieldValue(member: InChurchMember, field: string): unknown {
    switch (field) {
      case 'name':
        return member.name || null
      case 'email':
        return member.email || null
      case 'phone':
        return member.phone || null
      case 'birthDate':
        return member.birthDate || null
      case 'maritalStatus':
        return member.maritalStatus || null
      case 'address':
        return member.address || null
      default:
        return null
    }
  }

  private hasFieldChanged(oldValue: unknown, newValue: unknown): boolean {
    if (oldValue === newValue) {
      return false
    }

    if (this.isNullOrEmpty(oldValue) && this.isNullOrEmpty(newValue)) {
      return false
    }

    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue)
    }

    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      return oldValue.trim().toLowerCase() !== newValue.trim().toLowerCase()
    }

    return true
  }

  private isNullOrEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '' || 
           (typeof value === 'string' && value.trim() === '')
  }

  private parseJsonSafely(value: unknown): unknown {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  }

  calculateChangeSignificance(changes: FieldChange[]): 'low' | 'medium' | 'high' {
    const criticalFields = ['maritalStatus', 'address']
    const moderateFields = ['phone', 'email']

    const hasCriticalChanges = changes.some(change => 
      criticalFields.includes(change.field)
    )
    
    if (hasCriticalChanges) {
      return 'high'
    }

    const hasModerateChanges = changes.some(change =>
      moderateFields.includes(change.field)
    )

    if (hasModerateChanges || changes.length > 2) {
      return 'medium'
    }

    return 'low'
  }
}