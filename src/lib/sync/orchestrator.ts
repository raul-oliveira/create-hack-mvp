import { createClient } from '@/lib/supabase/server'
import { createInChurchClient, InChurchMember } from '@/lib/inchurch'
import { DeltaDetector } from './delta-detector'
import { ConflictResolver } from './conflict-resolver'

export interface SyncResult {
  organizationsProcessed: number
  totalRecordsSynced: number
  recordsCreated: number
  recordsUpdated: number
  recordsDeleted: number
  conflicts: number
  errors: Array<{
    organizationId: string
    error: string
  }>
}

export interface OrganizationConfig {
  id: string
  name: string
  inchurch_api_key: string | null
  inchurch_secret: string | null
  settings: Record<string, unknown>
}

export class SyncOrchestrator {
  private supabase: ReturnType<typeof createClient> | null = null
  private deltaDetector: DeltaDetector
  private conflictResolver: ConflictResolver

  constructor() {
    this.initializeSupabase()
    this.deltaDetector = new DeltaDetector()
    this.conflictResolver = new ConflictResolver()
  }

  private async initializeSupabase() {
    this.supabase = createClient()
  }

  async runDailySync(): Promise<SyncResult> {
    const result: SyncResult = {
      organizationsProcessed: 0,
      totalRecordsSynced: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      conflicts: 0,
      errors: []
    }

    try {
      const organizations = await this.getOrganizationsWithInChurch()
      console.log(`Found ${organizations.length} organizations to sync`)

      for (const org of organizations) {
        try {
          const orgResult = await this.syncOrganization(org)
          result.organizationsProcessed++
          result.totalRecordsSynced += orgResult.totalRecords
          result.recordsCreated += orgResult.created
          result.recordsUpdated += orgResult.updated
          result.recordsDeleted += orgResult.deleted
          result.conflicts += orgResult.conflicts

        } catch (error) {
          console.error(`Error syncing organization ${org.id}:`, error)
          result.errors.push({
            organizationId: org.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await this.logSyncCompletion(result)
      return result

    } catch (error) {
      console.error('Daily sync orchestration failed:', error)
      throw error
    }
  }

  private async getOrganizationsWithInChurch(): Promise<OrganizationConfig[]> {
    if (!this.supabase) await this.initializeSupabase()

    const { data, error } = await this.supabase!
      .from('organizations')
      .select('id, name, inchurch_api_key, inchurch_secret, settings')
      .not('inchurch_api_key', 'is', null)
      .not('inchurch_secret', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`)
    }

    return data || []
  }

  private async syncOrganization(org: OrganizationConfig) {
    console.log(`Syncing organization: ${org.name} (${org.id})`)

    if (!org.inchurch_api_key || !org.inchurch_secret) {
      throw new Error(`Missing InChurch credentials for organization ${org.id}`)
    }

    const inchurchClient = createInChurchClient({
      apiKey: org.inchurch_api_key,
      apiSecret: org.inchurch_secret
    })

    const result = {
      totalRecords: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0
    }

    let page = 1
    let hasMore = true

    while (hasMore) {
      try {
        console.log(`Fetching page ${page} for organization ${org.id}`)
        
        const response = await inchurchClient.getMembers(page, 100)
        
        if (!response.success || !response.data) {
          console.error(`Failed to fetch members for org ${org.id}:`, response.error)
          break
        }

        const members = response.data
        console.log(`Processing ${members.length} members from page ${page}`)

        for (const member of members) {
          try {
            const syncResult = await this.syncMember(member, org.id)
            result.totalRecords++
            
            if (syncResult.action === 'created') result.created++
            else if (syncResult.action === 'updated') result.updated++
            else if (syncResult.conflict) result.conflicts++
            
          } catch (error) {
            console.error(`Error syncing member ${member.id}:`, error)
          }
        }

        hasMore = response.pagination?.hasMore || false
        if (hasMore) {
          page++
          await this.rateLimitDelay()
        }

      } catch (error) {
        console.error(`Error fetching members page ${page}:`, error)
        break
      }
    }

    console.log(`Organization ${org.id} sync complete:`, result)
    return result
  }

  private async syncMember(member: InChurchMember, organizationId: string) {
    if (!this.supabase) await this.initializeSupabase()

    const { data: existingPerson, error: fetchError } = await this.supabase!
      .from('people')
      .select('*')
      .eq('inchurch_member_id', member.id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (fetchError) {
      throw new Error(`Failed to fetch existing person: ${fetchError.message}`)
    }

    if (!existingPerson) {
      return await this.createNewPerson(member, organizationId)
    } else {
      return await this.updateExistingPerson(existingPerson, member, organizationId)
    }
  }

  private async createNewPerson(member: InChurchMember, organizationId: string) {
    if (!this.supabase) await this.initializeSupabase()

    const { data: leader, error: leaderError } = await this.supabase!
      .from('leaders')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (leaderError || !leader) {
      throw new Error(`No leader found for organization ${organizationId}`)
    }

    const personRecord = {
      organization_id: organizationId,
      leader_id: leader.id,
      inchurch_member_id: member.id,
      name: member.name || 'Nome não informado',
      email: member.email || null,
      phone: member.phone || null,
      birth_date: member.birthDate || null,
      marital_status: member.maritalStatus || null,
      address: member.address ? JSON.stringify(member.address) : null,
      profile_data: JSON.stringify(member),
      sync_source: 'daily_polling',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase!
      .from('people')
      .insert(personRecord)

    if (error) {
      throw new Error(`Failed to create person: ${error.message}`)
    }

    await this.createChangeRecord(member.id, 'person.created', member, organizationId)

    return { action: 'created' as const, conflict: false }
  }

  private async updateExistingPerson(
    existingPerson: Record<string, unknown>,
    member: InChurchMember,
    organizationId: string
  ) {
    const changes = this.deltaDetector.detectChanges(existingPerson, member)
    
    if (changes.length === 0) {
      return { action: 'no_change' as const, conflict: false }
    }

    const conflict = await this.conflictResolver.checkForConflicts(
      existingPerson,
      member,
      changes
    )

    if (conflict) {
      await this.handleConflict(existingPerson, member, changes, organizationId)
      return { action: 'conflict' as const, conflict: true }
    }

    const updatedRecord = {
      name: member.name || existingPerson.name,
      email: member.email || existingPerson.email,
      phone: member.phone || existingPerson.phone,
      birth_date: member.birthDate || existingPerson.birth_date,
      marital_status: member.maritalStatus || existingPerson.marital_status,
      address: member.address ? JSON.stringify(member.address) : existingPerson.address,
      profile_data: JSON.stringify(member),
      sync_source: 'daily_polling',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase!
      .from('people')
      .update(updatedRecord)
      .eq('id', existingPerson.id)

    if (error) {
      throw new Error(`Failed to update person: ${error.message}`)
    }

    for (const change of changes) {
      await this.createChangeRecord(
        member.id,
        `person.updated.${change.field}`,
        { field: change.field, oldValue: change.oldValue, newValue: change.newValue },
        organizationId
      )
    }

    return { action: 'updated' as const, conflict: false }
  }

  private async createChangeRecord(
    inchurchMemberId: string,
    changeType: string,
    changeData: unknown,
    organizationId: string
  ) {
    if (!this.supabase) await this.initializeSupabase()

    const { data: person, error: personError } = await this.supabase!
      .from('people')
      .select('id')
      .eq('inchurch_member_id', inchurchMemberId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (personError || !person) {
      console.warn(`Person not found for change record: ${inchurchMemberId}`)
      return
    }

    const { error } = await this.supabase!
      .from('people_changes')
      .insert({
        person_id: person.id,
        change_type: changeType,
        new_value: JSON.stringify(changeData),
        detected_at: new Date().toISOString(),
        urgency_score: this.calculateUrgencyScore(changeType)
      })

    if (error) {
      console.error('Failed to create change record:', error)
    }
  }

  private calculateUrgencyScore(changeType: string): number {
    if (changeType.includes('marital_status') || changeType.includes('address')) {
      return 7
    }
    if (changeType.includes('phone') || changeType.includes('email')) {
      return 5
    }
    if (changeType === 'person.created') {
      return 6
    }
    return 4
  }

  private async handleConflict(
    existingPerson: Record<string, unknown>,
    member: InChurchMember,
    changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>,
    organizationId: string
  ) {
    console.log(`Handling conflict for person ${member.id}:`, changes)
    
    await this.createChangeRecord(
      member.id,
      'person.conflict',
      {
        existingData: existingPerson,
        inchurchData: member,
        conflicts: changes
      },
      organizationId
    )
  }

  private async rateLimitDelay() {
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  private async logSyncCompletion(result: SyncResult) {
    if (!this.supabase) await this.initializeSupabase()

    const { error } = await this.supabase!
      .from('sync_logs')
      .insert({
        sync_type: 'daily_polling',
        status: result.errors.length > 0 ? 'partial_success' : 'completed',
        records_processed: result.totalRecordsSynced,
        error_message: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log sync completion:', error)
    }
  }
}