'use client'

import { createClient } from '@/lib/supabase/client'
import { PersonSchema, DataSanitizer, ValidationError } from '@/lib/schemas/people'
import type { Person, CreatePerson, UpdatePerson } from '@/lib/schemas/people'
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

export class PeopleRepositoryClient {
  private supabase = createClient()

  async findMany(
    filter: PersonFilter,
    pagination: PaginationOptions = {}
  ): Promise<{ data: Person[]; total: number; hasMore: boolean }> {
    const {
      page = 1,
      limit = 50,
      orderBy = 'name',
      orderDirection = 'asc'
    } = pagination

    let query = this.supabase
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
    const validatedData = (data || []).map((person: any) => this.validatePerson(person))

    return {
      data: validatedData,
      total,
      hasMore
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
}