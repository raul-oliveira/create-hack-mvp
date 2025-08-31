import { InChurchMember } from '@/lib/inchurch/types'
import { FieldChange } from './delta-detector'

export type ConflictResolutionStrategy = 'remote_wins' | 'local_wins' | 'newest_wins' | 'manual_review'

export interface ConflictPolicy {
  default: ConflictResolutionStrategy
  fieldSpecific: Record<string, ConflictResolutionStrategy>
  manualReviewThreshold: number // hours since last local update
}

export class ConflictResolver {
  private readonly DEFAULT_POLICY: ConflictPolicy = {
    default: 'remote_wins', // InChurch is source of truth
    fieldSpecific: {
      'phone': 'newest_wins',
      'email': 'newest_wins',
      'address': 'manual_review', // Address changes are significant
      'maritalStatus': 'manual_review' // Marital status changes are critical
    },
    manualReviewThreshold: 24 // 24 hours
  }

  async checkForConflicts(
    existingRecord: Record<string, unknown>,
    inchurchMember: InChurchMember,
    changes: FieldChange[]
  ): Promise<boolean> {
    if (changes.length === 0) {
      return false
    }

    const lastLocalUpdate = this.getLastLocalUpdate(existingRecord)
    const timeSinceLastUpdate = Date.now() - lastLocalUpdate

    const hoursSinceLastUpdate = timeSinceLastUpdate / (1000 * 60 * 60)
    
    if (hoursSinceLastUpdate < this.DEFAULT_POLICY.manualReviewThreshold) {
      const hasRecentLocalChanges = await this.hasRecentLocalChanges(
        existingRecord.id as string,
        lastLocalUpdate
      )
      
      if (hasRecentLocalChanges) {
        return true
      }
    }

    const hasCriticalFieldConflicts = changes.some(change =>
      this.DEFAULT_POLICY.fieldSpecific[change.field] === 'manual_review'
    )

    return hasCriticalFieldConflicts
  }

  resolveConflicts(
    existingRecord: Record<string, unknown>,
    inchurchMember: InChurchMember,
    changes: FieldChange[],
    policy: ConflictPolicy = this.DEFAULT_POLICY
  ): Record<string, unknown> {
    const resolvedData = { ...existingRecord }

    for (const change of changes) {
      const strategy = policy.fieldSpecific[change.field] || policy.default
      
      switch (strategy) {
        case 'remote_wins':
          this.applyRemoteValue(resolvedData, change.field, change.newValue)
          break
          
        case 'local_wins':
          // Keep existing local value, no change needed
          break
          
        case 'newest_wins':
          if (this.isRemoteValueNewer(existingRecord, inchurchMember)) {
            this.applyRemoteValue(resolvedData, change.field, change.newValue)
          }
          break
          
        case 'manual_review':
          // Mark for manual review but apply remote value as default
          this.applyRemoteValue(resolvedData, change.field, change.newValue)
          break
      }
    }

    return resolvedData
  }

  private getLastLocalUpdate(record: Record<string, unknown>): number {
    const updatedAt = record.updated_at as string
    return updatedAt ? new Date(updatedAt).getTime() : 0
  }

  private async hasRecentLocalChanges(
    recordId: string,
    sinceTimestamp: number
  ): Promise<boolean> {
    // This would check if there have been recent changes via webhook or manual updates
    // For now, we'll assume no recent changes to keep it simple
    // In a full implementation, this would query people_changes table
    return false
  }

  private isRemoteValueNewer(
    existingRecord: Record<string, unknown>,
    inchurchMember: InChurchMember
  ): boolean {
    const localUpdatedAt = existingRecord.updated_at as string
    const remoteUpdatedAt = inchurchMember.updatedAt

    if (!localUpdatedAt || !remoteUpdatedAt) {
      return true // Default to remote if timestamps are missing
    }

    return new Date(remoteUpdatedAt).getTime() > new Date(localUpdatedAt).getTime()
  }

  private applyRemoteValue(
    resolvedData: Record<string, unknown>,
    field: string,
    newValue: unknown
  ): void {
    switch (field) {
      case 'name':
        resolvedData.name = newValue
        break
      case 'email':
        resolvedData.email = newValue
        break
      case 'phone':
        resolvedData.phone = newValue
        break
      case 'birthDate':
        resolvedData.birth_date = newValue
        break
      case 'maritalStatus':
        resolvedData.marital_status = newValue
        break
      case 'address':
        resolvedData.address = newValue ? JSON.stringify(newValue) : null
        break
    }
  }

  createConflictReport(
    existingRecord: Record<string, unknown>,
    inchurchMember: InChurchMember,
    changes: FieldChange[]
  ): Record<string, unknown> {
    return {
      recordId: existingRecord.id,
      inchurchMemberId: inchurchMember.id,
      conflictTimestamp: new Date().toISOString(),
      localData: {
        lastUpdated: existingRecord.updated_at,
        syncSource: existingRecord.sync_source,
        values: changes.reduce((acc, change) => ({
          ...acc,
          [change.field]: change.oldValue
        }), {})
      },
      remoteData: {
        lastUpdated: inchurchMember.updatedAt,
        values: changes.reduce((acc, change) => ({
          ...acc,
          [change.field]: change.newValue
        }), {})
      },
      conflicts: changes.map(change => ({
        field: change.field,
        localValue: change.oldValue,
        remoteValue: change.newValue,
        recommendedResolution: this.DEFAULT_POLICY.fieldSpecific[change.field] || this.DEFAULT_POLICY.default
      }))
    }
  }
}