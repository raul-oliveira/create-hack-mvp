import { InChurchWebhookEvent, InChurchMember } from '@/lib/inchurch/types'
import { createClient } from '@/lib/supabase/server'

export interface WebhookProcessingOptions {
  skipDuplicateCheck?: boolean
  immediateProcessing?: boolean
}

export class WebhookProcessor {
  private supabase: ReturnType<typeof createClient> | null = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    this.supabase = createClient()
  }

  async processEvent(
    event: InChurchWebhookEvent,
    options: WebhookProcessingOptions = {}
  ): Promise<boolean> {
    try {
      if (!options.skipDuplicateCheck && await this.isDuplicateEvent(event.id)) {
        console.log(`Skipping duplicate event: ${event.id}`)
        return true
      }

      switch (event.type) {
        case 'member.created':
          return await this.processMemberCreated(event)
        
        case 'member.updated':
          return await this.processMemberUpdated(event)
        
        case 'member.deleted':
          return await this.processMemberDeleted(event)
        
        case 'group.updated':
          return await this.processGroupUpdated(event)
        
        default:
          console.warn(`Unknown webhook event type: ${event.type}`)
          return false
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.id}:`, error)
      return false
    }
  }

  private async isDuplicateEvent(eventId: string): Promise<boolean> {
    if (!this.supabase) await this.initializeSupabase()
    
    const { data, error } = await this.supabase!!
      .from('sync_logs')
      .select('id')
      .eq('sync_type', 'webhook')
      .contains('error_message', eventId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking duplicate event:', error)
      return false
    }

    return !!data
  }

  private async processMemberCreated(event: InChurchWebhookEvent): Promise<boolean> {
    console.log(`Processing member created: ${event.id}`)
    
    const memberData = event.data as InChurchMember
    return await this.upsertPersonRecord(memberData, event.organizationId, 'webhook')
  }

  private async processMemberUpdated(event: InChurchWebhookEvent): Promise<boolean> {
    console.log(`Processing member updated: ${event.id}`)
    
    const memberData = event.data as InChurchMember
    const success = await this.upsertPersonRecord(memberData, event.organizationId, 'webhook')
    
    if (success) {
      await this.createChangeRecord(memberData.id, event.type, memberData, event.organizationId)
    }
    
    return success
  }

  private async processMemberDeleted(event: InChurchWebhookEvent): Promise<boolean> {
    console.log(`Processing member deleted: ${event.id}`)
    
    if (!this.supabase) await this.initializeSupabase()
    
    try {
      const memberData = event.data as InChurchMember
      
      const { error } = await this.supabase!!
        .from('people')
        .delete()
        .eq('inchurch_member_id', memberData.id)
        .eq('organization_id', event.organizationId)

      if (error) {
        console.error('Error deleting person:', error)
        return false
      }

      await this.createChangeRecord(memberData.id, event.type, memberData, event.organizationId)
      return true
      
    } catch (error) {
      console.error('Error in processMemberDeleted:', error)
      return false
    }
  }

  private async processGroupUpdated(event: InChurchWebhookEvent): Promise<boolean> {
    console.log(`Processing group updated: ${event.id}`)
    
    await this.createChangeRecord(
      (event.data as Record<string, unknown>).id, 
      event.type, 
      event.data, 
      event.organizationId
    )
    
    return true
  }

  private async upsertPersonRecord(
    memberData: InChurchMember,
    organizationId: string,
    syncSource: string
  ): Promise<boolean> {
    if (!this.supabase) await this.initializeSupabase()
    
    try {
      const { data: orgData, error: orgError } = await this.supabase!
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .maybeSingle()

      if (orgError || !orgData) {
        console.error(`Organization ${organizationId} not found`)
        return false
      }

      const { data: leaderData, error: leaderError } = await this.supabase!
        .from('leaders')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (leaderError || !leaderData) {
        console.error(`No leader found for organization ${organizationId}`)
        return false
      }

      const personRecord = {
        organization_id: organizationId,
        leader_id: leaderData.id,
        inchurch_member_id: memberData.id,
        name: memberData.name || 'Nome não informado',
        email: memberData.email || null,
        phone: memberData.phone || null,
        birth_date: memberData.birthDate || null,
        marital_status: memberData.maritalStatus || null,
        address: memberData.address ? JSON.stringify(memberData.address) : null,
        profile_data: JSON.stringify(memberData),
        sync_source: syncSource,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase!!
        .from('people')
        .upsert(personRecord, {
          onConflict: 'organization_id,inchurch_member_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Error upserting person record:', error)
        return false
      }

      return true
      
    } catch (error) {
      console.error('Error in upsertPersonRecord:', error)
      return false
    }
  }

  private async createChangeRecord(
    memberId: string,
    changeType: string,
    newValue: unknown,
    organizationId: string
  ): Promise<void> {
    if (!this.supabase) await this.initializeSupabase()
    
    try {
      const { data: person, error: personError } = await this.supabase!
        .from('people')
        .select('id')
        .eq('inchurch_member_id', memberId)
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (personError || !person) {
        console.warn(`Person not found for change record: ${memberId}`)
        return
      }

      const urgencyScore = this.calculateUrgencyScore(changeType, newValue)

      const { error } = await this.supabase!!
        .from('people_changes')
        .insert({
          person_id: person.id,
          change_type: changeType,
          new_value: JSON.stringify(newValue),
          detected_at: new Date().toISOString(),
          urgency_score: urgencyScore
        })

      if (error) {
        console.error('Error creating change record:', error)
      }
      
    } catch (error) {
      console.error('Error in createChangeRecord:', error)
    }
  }

  private calculateUrgencyScore(changeType: string, newValue: unknown): number {
    if (changeType === 'member.deleted') {
      return 9
    }
    
    if (changeType === 'member.updated' && newValue) {
      const data = newValue as Record<string, unknown>
      if (data.maritalStatus || data.address) {
        return 7
      }
      if (data.phone || data.email) {
        return 5
      }
    }
    
    if (changeType === 'member.created') {
      return 6
    }
    
    return 4
  }
}

export const webhookProcessor = new WebhookProcessor()