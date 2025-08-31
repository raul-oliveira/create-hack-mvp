import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { PersonSchema, PersonChangeSchema, DataSanitizer, ValidationError } from '@/lib/schemas/people'
import type { Person, CreatePerson, UpdatePerson, PersonChange } from '@/lib/schemas/people'
import { z } from 'zod'

export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PersonFilter {
  organizationId: string
  leaderId?: string
  search?: string
  maritalStatus?: string
  syncSource?: string
  hasRecentChanges?: boolean
}

export class PeopleRepository {
  private supabase: ReturnType<typeof createBrowserClient> | null = null
  private isServer: boolean = typeof window === 'undefined'

  constructor() {
    if (!this.isServer) {
      this.supabase = createBrowserClient()
    }
  }

  private async getSupabaseClient() {
    if (!this.isServer) {
      return this.supabase!
    } else {
      return await createServerClient()
    }
  }

  async findMany(
    filter: PersonFilter,
    pagination: PaginationOptions = {}
  ): Promise<{ data: Person[]; total: number; hasMore: boolean }> {
    const supabase = await this.getSupabaseClient()

    const {
      page = 1,
      limit = 50,
      orderBy = 'name',
      orderDirection = 'asc'
    } = pagination

    let query = supabase
      .from('people')
      .select('*', { count: 'exact' })
      .eq('organization_id', filter.organizationId)

    if (filter.leaderId) {
      query = query.eq('leader_id', filter.leaderId)
    }

    if (filter.search) {
      query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
    }

    if (filter.maritalStatus) {
      query = query.eq('marital_status', filter.maritalStatus)
    }

    if (filter.syncSource) {
      query = query.eq('sync_source', filter.syncSource)
    }

    if (filter.hasRecentChanges) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('last_synced_at', twentyFourHoursAgo)
    }

    const offset = (page - 1) * limit
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch people: ${error.message}`)
    }

    const total = count || 0
    const hasMore = offset + limit < total

    // Validate and sanitize data
    const validatedData = data?.map(person => this.validatePerson(person)) || []

    return {
      data: validatedData,
      total,
      hasMore
    }
  }

  async findById(id: string, organizationId: string): Promise<Person | null> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch person: ${error.message}`)
    }

    return data ? this.validatePerson(data) : null
  }

  async findByInChurchId(
    inchurchMemberId: string,
    organizationId: string
  ): Promise<Person | null> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('inchurch_member_id', inchurchMemberId)
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch person by InChurch ID: ${error.message}`)
    }

    return data ? this.validatePerson(data) : null
  }

  async create(personData: CreatePerson, organizationId: string, leaderId: string): Promise<Person> {
    const supabase = await this.getSupabaseClient()

    // Sanitize and validate data
    const sanitizedData = this.sanitizePersonData(personData)
    const validatedData = PersonSchema.parse({
      ...sanitizedData,
      organization_id: organizationId,
      leader_id: leaderId
    })

    const { data, error } = await supabase
      .from('people')
      .insert({
        organization_id: validatedData.organization_id,
        leader_id: validatedData.leader_id,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        birth_date: validatedData.birth_date,
        marital_status: validatedData.marital_status,
        address: validatedData.address ? JSON.stringify(validatedData.address) : null,
        profile_data: validatedData.profile_data ? JSON.stringify(validatedData.profile_data) : null,
        sync_source: validatedData.sync_source,
        last_synced_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create person: ${error.message}`)
    }

    // Log creation as a change
    await this.createChangeRecord({
      person_id: data.id,
      change_type: 'person.created',
      new_value: data,
      detected_at: new Date().toISOString(),
      urgency_score: 6
    })

    return this.validatePerson(data)
  }

  async update(id: string, updates: UpdatePerson, organizationId: string): Promise<Person> {
    if (!this.supabase) await this.initializeSupabase()

    // Get existing record for change detection
    const existingPerson = await this.findById(id, organizationId)
    if (!existingPerson) {
      throw new Error('Person not found')
    }

    // Sanitize and validate updates
    const sanitizedUpdates = this.sanitizePersonData(updates)
    const validatedUpdates = PersonSchema.partial().parse(sanitizedUpdates)

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are being updated
    if (validatedUpdates.name !== undefined) updateData.name = validatedUpdates.name
    if (validatedUpdates.email !== undefined) updateData.email = validatedUpdates.email
    if (validatedUpdates.phone !== undefined) updateData.phone = validatedUpdates.phone
    if (validatedUpdates.birth_date !== undefined) updateData.birth_date = validatedUpdates.birth_date
    if (validatedUpdates.marital_status !== undefined) updateData.marital_status = validatedUpdates.marital_status
    if (validatedUpdates.address !== undefined) {
      updateData.address = validatedUpdates.address ? JSON.stringify(validatedUpdates.address) : null
    }
    if (validatedUpdates.profile_data !== undefined) {
      updateData.profile_data = validatedUpdates.profile_data ? JSON.stringify(validatedUpdates.profile_data) : null
    }

    const supabase = await this.getSupabaseClient()
    const { data, error } = await supabase
      .from('people')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update person: ${error.message}`)
    }

    // Detect and log changes
    await this.detectAndLogChanges(existingPerson, this.validatePerson(data))

    return this.validatePerson(data)
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const supabase = await this.getSupabaseClient()

    // Get person data for logging
    const person = await this.findById(id, organizationId)
    if (!person) {
      throw new Error('Person not found')
    }

    // Soft delete by updating a deleted_at timestamp (if column exists)
    // For now, we'll do hard delete but log it
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to delete person: ${error.message}`)
    }

    // Log deletion
    await this.createChangeRecord({
      person_id: id,
      change_type: 'person.deleted',
      old_value: person,
      new_value: null,
      detected_at: new Date().toISOString(),
      urgency_score: 8
    })
  }

  async getRecentChanges(
    organizationId: string,
    limit = 50
  ): Promise<PersonChange[]> {
    const supabase = await this.getSupabaseClient()

    const { data, error } = await supabase
      .from('people_changes')
      .select(`
        *,
        people!inner(organization_id, name)
      `)
      .eq('people.organization_id', organizationId)
      .order('detected_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch recent changes: ${error.message}`)
    }

    return (data || []).map((change: any) => PersonChangeSchema.parse(change))
  }

  async getStatistics(organizationId: string): Promise<{
    totalPeople: number
    recentlyAdded: number
    recentChanges: number
    byMaritalStatus: Record<string, number>
    bySyncSource: Record<string, number>
  }> {
    const supabase = await this.getSupabaseClient()

    const [totalResult, recentResult, statusResult, sourceResult, changesResult] = await Promise.all([
      // Total people
      supabase
        .from('people')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId),

      // Recently added (last 7 days)
      supabase
        .from('people')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // By marital status
      supabase
        .from('people')
        .select('marital_status')
        .eq('organization_id', organizationId),

      // By sync source
      supabase
        .from('people')
        .select('sync_source')
        .eq('organization_id', organizationId),

      // Recent changes (last 24 hours)
      supabase
        .from('people_changes')
        .select(`
          id,
          people!inner(organization_id)
        `, { count: 'exact', head: true })
        .eq('people.organization_id', organizationId)
        .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    const byMaritalStatus = (statusResult.data || []).reduce((acc: Record<string, number>, person: any) => {
      const status = person.marital_status || 'not_specified'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySyncSource = (sourceResult.data || []).reduce((acc: Record<string, number>, person: any) => {
      const source = person.sync_source || 'manual'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalPeople: totalResult.count || 0,
      recentlyAdded: recentResult.count || 0,
      recentChanges: changesResult.count || 0,
      byMaritalStatus,
      bySyncSource
    }
  }

  private validatePerson(data: any): Person {
    try {
      // Parse JSON fields if they're strings
      const personData = { ...data } as Record<string, any>
      
      if (typeof personData.address === 'string') {
        personData.address = JSON.parse(personData.address)
      }
      
      if (typeof personData.profile_data === 'string') {
        personData.profile_data = JSON.parse(personData.profile_data)
      }

      return PersonSchema.parse(personData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error)
      }
      throw error
    }
  }

  private sanitizePersonData(data: Partial<CreatePerson | UpdatePerson>): Partial<CreatePerson | UpdatePerson> {
    const sanitized = { ...data }

    if (sanitized.name) {
      sanitized.name = DataSanitizer.sanitizeName(sanitized.name)
    }

    if (sanitized.phone) {
      sanitized.phone = DataSanitizer.sanitizePhone(sanitized.phone)
    }

    if (sanitized.email) {
      sanitized.email = DataSanitizer.sanitizeEmail(sanitized.email)
    }

    if (sanitized.address) {
      sanitized.address = DataSanitizer.sanitizeAddress(sanitized.address as any)
    }

    return sanitized
  }

  private async detectAndLogChanges(oldPerson: Person, newPerson: Person): Promise<void> {
    const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = []

    // Compare key fields
    const fieldsToCompare = ['name', 'email', 'phone', 'birth_date', 'marital_status', 'address']

    for (const field of fieldsToCompare) {
      const oldValue = oldPerson[field as keyof Person]
      const newValue = newPerson[field as keyof Person]

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue })
      }
    }

    // Log each change
    for (const change of changes) {
      await this.createChangeRecord({
        person_id: newPerson.id,
        change_type: `person.updated.${change.field}`,
        old_value: change.oldValue,
        new_value: change.newValue,
        detected_at: new Date().toISOString(),
        urgency_score: this.calculateUrgencyScore(change.field, change.newValue)
      })
    }
  }

  private calculateUrgencyScore(field: string, _newValue: unknown): number {
    const urgencyMap: Record<string, number> = {
      'marital_status': 8,
      'address': 7,
      'phone': 6,
      'email': 5,
      'name': 4,
      'birth_date': 3
    }

    return urgencyMap[field] || 5
  }

  private async createChangeRecord(change: PersonChange): Promise<void> {
    const supabase = await this.getSupabaseClient()

    const { error } = await supabase
      .from('people_changes')
      .insert({
        person_id: change.person_id,
        change_type: change.change_type,
        old_value: change.old_value ? JSON.stringify(change.old_value) : null,
        new_value: change.new_value ? JSON.stringify(change.new_value) : null,
        detected_at: change.detected_at,
        urgency_score: change.urgency_score,
        ai_analysis: change.ai_analysis ? JSON.stringify(change.ai_analysis) : null
      })

    if (error) {
      console.error('Failed to create change record:', error)
    }
  }
}