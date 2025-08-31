'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  Initiative, 
  InitiativeWithPerson, 
  InitiativeStats, 
  CreateInitiative,
  UpdateInitiative, 
  InitiativeFilters,
  validateInitiative,
  validateCreateInitiative,
  validateUpdateInitiative
} from '@/lib/schemas/initiatives'

export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

export class InitiativeRepositoryClient {
  private supabase = createClient()

  async create(data: CreateInitiative): Promise<Initiative> {
    const validation = validateCreateInitiative(data)
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }
    
    const { data: initiative, error } = await this.supabase
      .from('initiatives')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create initiative: ${error.message}`)
    }

    const result = validateInitiative({
      ...initiative,
      created_at: new Date(initiative.created_at),
      updated_at: new Date(initiative.updated_at),
      due_date: initiative.due_date ? new Date(initiative.due_date) : null,
      completed_at: initiative.completed_at ? new Date(initiative.completed_at) : null,
      whatsapp_clicked_at: initiative.whatsapp_clicked_at ? new Date(initiative.whatsapp_clicked_at) : null
    })

    if (!result.success) {
      throw new Error(`Data validation error: ${result.error.message}`)
    }

    return result.data
  }

  async findMany(
    filters: InitiativeFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<InitiativeWithPerson>> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = pagination

    let query = this.supabase
      .from('initiatives')
      .select(`
        *,
        person:people!initiatives_person_id_fkey(
          id,
          name,
          email,
          phone,
          birth_date
        ),
        change:people_changes!initiatives_change_id_fkey(*)
      `)

    // Apply filters
    if (filters.leader_id) {
      query = query.eq('leader_id', filters.leader_id)
    }
    if (filters.person_id) {
      query = query.eq('person_id', filters.person_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }
    if (filters.due_after) {
      query = query.gte('due_date', filters.due_after)
    }
    if (filters.due_before) {
      query = query.lte('due_date', filters.due_before)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const { data, error, count } = await query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch initiatives: ${error.message}`)
    }

    const total = count || 0
    const hasMore = offset + limit < total

    return {
      data: (data || []) as InitiativeWithPerson[],
      total,
      hasMore,
      page,
      limit
    }
  }

  async update(id: string, data: UpdateInitiative): Promise<Initiative> {
    const validation = validateUpdateInitiative(data)
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }
    
    const { data: initiative, error } = await this.supabase
      .from('initiatives')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update initiative: ${error.message}`)
    }

    const result = validateInitiative({
      ...initiative,
      created_at: new Date(initiative.created_at),
      updated_at: new Date(initiative.updated_at),
      due_date: initiative.due_date ? new Date(initiative.due_date) : null,
      completed_at: initiative.completed_at ? new Date(initiative.completed_at) : null,
      whatsapp_clicked_at: initiative.whatsapp_clicked_at ? new Date(initiative.whatsapp_clicked_at) : null
    })

    if (!result.success) {
      throw new Error(`Data validation error: ${result.error.message}`)
    }

    return result.data
  }

  async getStatsForLeader(leaderId: string): Promise<InitiativeStats> {
    const { data: stats, error } = await this.supabase.rpc('get_initiative_stats', {
      p_leader_id: leaderId
    })
    
    if (error) {
      // Fallback to manual calculation if function doesn't exist
      return this.calculateStatsManually(leaderId)
    }
    return stats
  }

  private async calculateStatsManually(leaderId: string): Promise<InitiativeStats> {
    // Get all initiatives for leader
    const { data: initiatives, error } = await this.supabase
      .from('initiatives')
      .select('*')
      .eq('leader_id', leaderId)

    if (error) {
      throw new Error(`Failed to fetch initiatives: ${error.message}`)
    }

    if (!initiatives) {
      return {
        total_pending: 0,
        total_in_progress: 0, 
        total_completed: 0,
        total_cancelled: 0,
        completion_rate: 0,
        overdue_count: 0,
        high_priority_count: 0,
        avg_completion_time_days: null
      }
    }

    const now = new Date()
    const pending = initiatives.filter(i => i.status === 'pending')
    const inProgress = initiatives.filter(i => i.status === 'in_progress')
    const completed = initiatives.filter(i => i.status === 'completed')
    const cancelled = initiatives.filter(i => i.status === 'cancelled')

    const total = initiatives.length
    const completedCount = completed.length
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

    // Count overdue items (pending or in_progress with due_date in the past)
    const overdueCount = initiatives.filter(i => 
      (i.status === 'pending' || i.status === 'in_progress') &&
      i.due_date &&
      new Date(i.due_date) < now
    ).length

    // Count high priority items
    const highPriorityCount = initiatives.filter(i => 
      i.priority === 'high' && 
      (i.status === 'pending' || i.status === 'in_progress')
    ).length

    // Calculate average completion time
    let avgCompletionTimeDays: number | null = null
    if (completed.length > 0) {
      const completionTimes = completed
        .filter(i => i.completed_at && i.created_at)
        .map(i => {
          const completedAt = new Date(i.completed_at!)
          const createdAt = new Date(i.created_at)
          return Math.round((completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        })

      if (completionTimes.length > 0) {
        avgCompletionTimeDays = Math.round(
          completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        )
      }
    }

    return {
      total_pending: pending.length,
      total_in_progress: inProgress.length,
      total_completed: completed.length,
      total_cancelled: cancelled.length,
      completion_rate: completionRate,
      overdue_count: overdueCount,
      high_priority_count: highPriorityCount,
      avg_completion_time_days: avgCompletionTimeDays
    }
  }
}