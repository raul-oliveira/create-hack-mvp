import { InitiativeRepository } from '@/lib/data/initiative-repository'
import { PeopleRepository } from '@/lib/data/people-repository'
import { Person } from '@/lib/schemas/people'
import { PeopleChange, ChangeType } from '@/lib/schemas/initiatives'

export interface ChangeDetectionResult {
  changes: DetectedChange[]
  totalProcessed: number
  errors: string[]
}

export interface DetectedChange {
  personId: string
  changeType: ChangeType
  field: string
  oldValue: unknown
  newValue: unknown
  urgencyScore: number
  context?: Record<string, unknown>
}

export interface ChangeDetectionOptions {
  batchSize?: number
  includeMinorChanges?: boolean
  maxAge?: number // hours
}

export class ChangeDetectionService {
  private initiativeRepo = new InitiativeRepository()
  private peopleRepo = new PeopleRepository()

  // Main change detection method
  async detectChanges(
    currentData: Person,
    previousData: Person | null,
    options: ChangeDetectionOptions = {}
  ): Promise<DetectedChange[]> {
    if (!previousData) {
      return [] // No previous data to compare
    }

    const changes: DetectedChange[] = []

    // Compare all relevant fields
    const fieldComparisons = [
      { field: 'name', type: 'personal_data' as ChangeType },
      { field: 'email', type: 'personal_data' as ChangeType },
      { field: 'phone', type: 'personal_data' as ChangeType },
      { field: 'birth_date', type: 'special_date' as ChangeType },
      { field: 'marital_status', type: 'relationship' as ChangeType },
      { field: 'address', type: 'personal_data' as ChangeType },
      { field: 'city', type: 'personal_data' as ChangeType },
      { field: 'state', type: 'personal_data' as ChangeType },
      { field: 'postal_code', type: 'personal_data' as ChangeType },
      { field: 'emergency_contact', type: 'personal_data' as ChangeType },
      { field: 'profession', type: 'personal_data' as ChangeType },
      { field: 'education_level', type: 'personal_data' as ChangeType }
    ]

    for (const { field, type } of fieldComparisons) {
      const oldValue = previousData[field as keyof Person]
      const newValue = currentData[field as keyof Person]

      if (this.hasValueChanged(oldValue, newValue)) {
        const urgencyScore = this.calculateUrgencyScore(field, oldValue, newValue, type, currentData)
        
        if (urgencyScore >= 3 || options.includeMinorChanges) {
          changes.push({
            personId: currentData.id!,
            changeType: type,
            field,
            oldValue,
            newValue,
            urgencyScore,
            context: this.getChangeContext(field, oldValue, newValue, currentData)
          })
        }
      }
    }

    // Detect special date proximity (birthdays, anniversaries)
    const specialDateChanges = this.detectSpecialDates(currentData)
    changes.push(...specialDateChanges)

    // Detect profile data changes (JSONB comparison)
    if (currentData.profile_data || previousData.profile_data) {
      const profileChanges = this.detectProfileChanges(
        previousData.profile_data,
        currentData.profile_data,
        currentData.id!
      )
      changes.push(...profileChanges)
    }

    return changes
  }

  // Process batch of changes
  async processBatch(
    organizationId: string,
    options: ChangeDetectionOptions = {}
  ): Promise<ChangeDetectionResult> {
    const { batchSize = 50, maxAge = 24 } = options
    const errors: string[] = []
    let totalProcessed = 0

    try {
      // Get people with recent updates
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - maxAge)

      const recentlyUpdated = await this.peopleRepo.findMany(
        { organizationId, updatedAfter: cutoffDate },
        { limit: batchSize, orderBy: 'updated_at', orderDirection: 'desc' }
      )

      const detectedChanges: DetectedChange[] = []

      for (const person of recentlyUpdated.data) {
        try {
          // Get previous version from people_changes or create snapshot
          const previousData = await this.getPreviousPersonData(person.id!)
          
          if (previousData) {
            const changes = await this.detectChanges(person, previousData, options)
            detectedChanges.push(...changes)
          }

          totalProcessed++
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error processing person ${person.id}: ${message}`)
        }
      }

      // Store detected changes
      for (const change of detectedChanges) {
        try {
          await this.initiativeRepo.createPeopleChange({
            person_id: change.personId,
            change_type: change.changeType,
            old_value: change.oldValue,
            new_value: change.newValue,
            urgency_score: change.urgencyScore,
            ai_analysis: change.context || null
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error storing change for person ${change.personId}: ${message}`)
        }
      }

      return {
        changes: detectedChanges,
        totalProcessed,
        errors
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Batch processing error: ${message}`)
      return {
        changes: [],
        totalProcessed,
        errors
      }
    }
  }

  // Calculate urgency score based on change type and context
  private calculateUrgencyScore(
    field: string,
    oldValue: unknown,
    newValue: unknown,
    changeType: ChangeType,
    person: Person
  ): number {
    let baseScore = 5 // Default medium priority

    switch (changeType) {
      case 'life_event':
        baseScore = 9 // High priority
        break
      case 'relationship':
        baseScore = this.getRelationshipChangeScore(field, oldValue, newValue)
        break
      case 'personal_data':
        baseScore = this.getPersonalDataChangeScore(field, oldValue, newValue)
        break
      case 'engagement':
        baseScore = 7 // Medium-high priority
        break
      case 'special_date':
        baseScore = this.getSpecialDateScore(field, person)
        break
    }

    // Adjust based on person context
    baseScore = this.adjustScoreForContext(baseScore, person)

    return Math.max(1, Math.min(10, Math.round(baseScore)))
  }

  private getRelationshipChangeScore(field: string, oldValue: unknown, newValue: unknown): number {
    if (field === 'marital_status') {
      const old = oldValue as string
      const current = newValue as string

      // Major life changes
      if ((old === 'single' && current === 'married') || 
          (old === 'married' && current === 'divorced') ||
          (old === 'married' && current === 'widowed')) {
        return 9
      }
      
      // Other status changes
      if (old !== current) {
        return 7
      }
    }
    return 6
  }

  private getPersonalDataChangeScore(field: string, oldValue: unknown, newValue: unknown): number {
    // Contact information changes are more important
    if (field === 'phone' || field === 'email') {
      return 6
    }
    
    // Address changes
    if (field === 'address' || field === 'city' || field === 'state') {
      return 5
    }
    
    // Name changes are significant
    if (field === 'name') {
      return 7
    }

    return 4
  }

  private getSpecialDateScore(field: string, person: Person): number {
    if (field === 'birth_date' && person.birth_date) {
      const today = new Date()
      const birthDate = new Date(person.birth_date)
      const daysUntilBirthday = this.getDaysUntilBirthday(birthDate, today)
      
      // Higher score as birthday approaches
      if (daysUntilBirthday <= 7) return 8
      if (daysUntilBirthday <= 14) return 6
      if (daysUntilBirthday <= 30) return 4
    }
    return 3
  }

  private adjustScoreForContext(baseScore: number, person: Person): number {
    let adjusted = baseScore

    // Boost score for people with recent activity
    if (person.last_synced_at) {
      const daysSinceSync = Math.floor(
        (new Date().getTime() - new Date(person.last_synced_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceSync <= 1) {
        adjusted += 0.5 // Recent sync indicates active changes
      }
    }

    return adjusted
  }

  // Detect upcoming special dates
  private detectSpecialDates(person: Person): DetectedChange[] {
    const changes: DetectedChange[] = []
    const today = new Date()

    if (person.birth_date) {
      const birthDate = new Date(person.birth_date)
      const daysUntil = this.getDaysUntilBirthday(birthDate, today)
      
      // Detect upcoming birthday
      if (daysUntil <= 30 && daysUntil >= 0) {
        const urgencyScore = this.getSpecialDateScore('birth_date', person)
        changes.push({
          personId: person.id!,
          changeType: 'special_date',
          field: 'upcoming_birthday',
          oldValue: null,
          newValue: daysUntil,
          urgencyScore,
          context: {
            daysUntilBirthday: daysUntil,
            age: this.calculateAge(birthDate, today)
          }
        })
      }
    }

    return changes
  }

  // Detect changes in profile_data JSONB field
  private detectProfileChanges(
    oldProfile: Record<string, unknown> | null,
    newProfile: Record<string, unknown> | null,
    personId: string
  ): DetectedChange[] {
    const changes: DetectedChange[] = []

    if (!oldProfile && !newProfile) return changes

    const oldData = oldProfile || {}
    const newData = newProfile || {}
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])

    for (const key of allKeys) {
      const oldValue = oldData[key]
      const newValue = newData[key]

      if (this.hasValueChanged(oldValue, newValue)) {
        const urgencyScore = this.getProfileFieldScore(key, oldValue, newValue)
        
        changes.push({
          personId,
          changeType: 'personal_data',
          field: `profile.${key}`,
          oldValue,
          newValue,
          urgencyScore,
          context: { profileField: key }
        })
      }
    }

    return changes
  }

  private getProfileFieldScore(field: string, oldValue: unknown, newValue: unknown): number {
    // Customize scoring based on profile field importance
    const importantFields = ['family_members', 'emergency_contacts', 'health_info']
    
    if (importantFields.includes(field)) {
      return 6
    }
    
    return 4
  }

  // Utility methods

  private hasValueChanged(oldValue: unknown, newValue: unknown): boolean {
    // Handle null/undefined equivalence
    if ((oldValue === null || oldValue === undefined) && 
        (newValue === null || newValue === undefined)) {
      return false
    }

    // Deep comparison for objects
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue)
    }

    return oldValue !== newValue
  }

  private getDaysUntilBirthday(birthDate: Date, today: Date): number {
    const thisYear = today.getFullYear()
    const birthdayThisYear = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
    
    if (birthdayThisYear < today) {
      // Birthday already passed, check next year
      const birthdayNextYear = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate())
      return Math.ceil((birthdayNextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      return Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  private calculateAge(birthDate: Date, currentDate: Date): number {
    let age = currentDate.getFullYear() - birthDate.getFullYear()
    const monthDiff = currentDate.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  private getChangeContext(
    field: string,
    oldValue: unknown,
    newValue: unknown,
    person: Person
  ): Record<string, unknown> {
    const context: Record<string, unknown> = {
      field,
      changeDetectedAt: new Date().toISOString(),
      personName: person.name
    }

    // Add field-specific context
    if (field === 'marital_status') {
      context.relationshipChange = {
        from: oldValue,
        to: newValue,
        isSignificant: this.isSignificantRelationshipChange(oldValue as string, newValue as string)
      }
    }

    if (field === 'phone' || field === 'email') {
      context.contactUpdate = {
        hadPrevious: !!oldValue,
        nowHasContact: !!newValue
      }
    }

    return context
  }

  private isSignificantRelationshipChange(oldStatus: string, newStatus: string): boolean {
    const significantChanges = [
      ['single', 'married'],
      ['married', 'divorced'],
      ['married', 'widowed'],
      ['single', 'engaged'],
      ['engaged', 'married']
    ]

    return significantChanges.some(([from, to]) => 
      (oldStatus === from && newStatus === to) || 
      (oldStatus === to && newStatus === from)
    )
  }

  // Get previous person data for comparison
  private async getPreviousPersonData(personId: string): Promise<Person | null> {
    try {
      // In a real implementation, you might:
      // 1. Query a person_history table
      // 2. Use the last known snapshot from people_changes
      // 3. Cache previous states in Redis
      
      // For now, we'll simulate by returning null for first-time detection
      // This would be enhanced with actual historical data storage
      return null
    } catch {
      return null
    }
  }

  // Process unprocessed changes
  async processUnprocessedChanges(limit: number = 100): Promise<PeopleChange[]> {
    return await this.initiativeRepo.findUnprocessedChanges(limit)
  }

  // Mark change as processed
  async markChangeProcessed(changeId: string, aiAnalysis?: Record<string, unknown>): Promise<void> {
    await this.initiativeRepo.markChangeAsProcessed(changeId, aiAnalysis)
  }
}