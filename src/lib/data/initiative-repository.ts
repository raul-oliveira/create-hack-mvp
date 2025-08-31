import { createClient } from '@/lib/supabase/server'
import { 
  Initiative, 
  InitiativeWithPerson,
  InitiativeStats,
  CreateInitiative, 
  UpdateInitiative, 
  InitiativeFilters,
  PeopleChange,
  InitiativeFeedback,
  validateInitiative,
  validateCreateInitiative,
  validateUpdateInitiative,
  validatePeopleChange,
  validateInitiativeFeedback
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

export class InitiativeRepository {
  private async getClient() {
    return await createClient()
  }

  // Initiative CRUD operations

  async create(data: CreateInitiative): Promise<Initiative> {
    const validation = validateCreateInitiative(data)
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }

    const supabase = await this.getClient()
    
    const { data: initiative, error } = await supabase
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

  async findById(id: string): Promise<Initiative | null> {
    const supabase = await this.getClient()
    
    const { data: initiative, error } = await supabase
      .from('initiatives')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find initiative: ${error.message}`)
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
    const supabase = await this.getClient()
    
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = pagination

    let query = supabase
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
    if (filters.priority_min) {
      query = query.gte('priority', filters.priority_min)
    }
    if (filters.priority_max) {
      query = query.lte('priority', filters.priority_max)
    }
    if (filters.due_before) {
      query = query.lte('due_date', filters.due_before.toISOString())
    }
    if (filters.due_after) {
      query = query.gte('due_date', filters.due_after.toISOString())
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Count total records
    const { count } = await query.select('*', { count: 'exact', head: true })
    const total = count || 0

    // Apply pagination and ordering
    const offset = (page - 1) * limit
    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: initiatives, error } = await query

    if (error) {
      throw new Error(`Failed to fetch initiatives: ${error.message}`)
    }

    const processedData: InitiativeWithPerson[] = initiatives.map(initiative => ({
      ...initiative,
      created_at: new Date(initiative.created_at),
      updated_at: new Date(initiative.updated_at),
      due_date: initiative.due_date ? new Date(initiative.due_date) : null,
      completed_at: initiative.completed_at ? new Date(initiative.completed_at) : null,
      whatsapp_clicked_at: initiative.whatsapp_clicked_at ? new Date(initiative.whatsapp_clicked_at) : null,
      person: initiative.person ? {
        ...initiative.person,
        birth_date: initiative.person.birth_date ? new Date(initiative.person.birth_date) : null
      } : undefined,
      change: initiative.change ? {
        ...initiative.change,
        detected_at: new Date(initiative.change.detected_at),
        processed_at: initiative.change.processed_at ? new Date(initiative.change.processed_at) : null
      } : undefined
    }))

    return {
      data: processedData,
      total,
      hasMore: offset + limit < total,
      page,
      limit
    }
  }

  async update(id: string, data: UpdateInitiative): Promise<Initiative> {
    const validation = validateUpdateInitiative(data)
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }

    const supabase = await this.getClient()
    
    const { data: initiative, error } = await supabase
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

  async delete(id: string): Promise<void> {
    const supabase = await this.getClient()
    
    const { error } = await supabase
      .from('initiatives')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete initiative: ${error.message}`)
    }
  }

  // People changes operations

  async createPeopleChange(data: Omit<PeopleChange, 'id' | 'detected_at'>): Promise<PeopleChange> {
    const validation = validatePeopleChange({
      ...data,
      detected_at: new Date()
    })
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }

    const supabase = await this.getClient()
    
    const { data: change, error } = await supabase
      .from('people_changes')
      .insert({
        ...data,
        detected_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create people change: ${error.message}`)
    }

    const result = validatePeopleChange({
      ...change,
      detected_at: new Date(change.detected_at),
      processed_at: change.processed_at ? new Date(change.processed_at) : null
    })

    if (!result.success) {
      throw new Error(`Data validation error: ${result.error.message}`)
    }

    return result.data
  }

  async findUnprocessedChanges(limit: number = 50): Promise<PeopleChange[]> {
    const supabase = await this.getClient()
    
    const { data: changes, error } = await supabase
      .from('people_changes')
      .select()
      .is('processed_at', null)
      .order('detected_at', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch unprocessed changes: ${error.message}`)
    }

    return changes.map(change => ({
      ...change,
      detected_at: new Date(change.detected_at),
      processed_at: change.processed_at ? new Date(change.processed_at) : null
    }))
  }

  async markChangeAsProcessed(id: string, aiAnalysis?: Record<string, unknown>): Promise<void> {
    const supabase = await this.getClient()
    
    const { error } = await supabase
      .from('people_changes')
      .update({
        processed_at: new Date().toISOString(),
        ai_analysis: aiAnalysis || null
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to mark change as processed: ${error.message}`)
    }
  }

  // Initiative feedback operations

  async createFeedback(data: Omit<InitiativeFeedback, 'id' | 'created_at'>): Promise<InitiativeFeedback> {
    const validation = validateInitiativeFeedback({
      ...data,
      created_at: new Date()
    })
    if (!validation.success) {
      throw new Error(`Validation error: ${validation.error.message}`)
    }

    const supabase = await this.getClient()
    
    const { data: feedback, error } = await supabase
      .from('initiative_feedback')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create feedback: ${error.message}`)
    }

    const result = validateInitiativeFeedback({
      ...feedback,
      created_at: new Date(feedback.created_at)
    })

    if (!result.success) {
      throw new Error(`Data validation error: ${result.error.message}`)
    }

    return result.data
  }

  // Statistics and analytics

  async getStatsForLeader(leaderId: string): Promise<InitiativeStats> {
    const supabase = await this.getClient()
    
    const { data: stats, error } = await supabase.rpc('get_initiative_stats', {
      p_leader_id: leaderId
    })

    if (error) {
      // Fallback to manual calculation if function doesn't exist
      return this.calculateStatsManually(leaderId)
    }

    return stats
  }

  private async calculateStatsManually(leaderId: string): Promise<InitiativeStats> {
    const supabase = await this.getClient()
    
    // Get all initiatives for leader
    const { data: initiatives, error } = await supabase
      .from('initiatives')
      .select('status, created_at, completed_at, due_date')
      .eq('leader_id', leaderId)

    if (error) {
      throw new Error(`Failed to fetch initiatives for stats: ${error.message}`)
    }

    const now = new Date()
    const stats = {
      total_pending: 0,
      total_in_progress: 0,
      total_completed: 0,
      overdue_count: 0,
      high_priority_count: 0,
      completion_rate: 0,
      avg_completion_time_days: null as number | null
    }

    let completionTimes: number[] = []

    for (const initiative of initiatives) {
      // Count by status
      if (initiative.status === 'pending') stats.total_pending++
      else if (initiative.status === 'in_progress') stats.total_in_progress++
      else if (initiative.status === 'completed') stats.total_completed++

      // Count overdue
      if (initiative.due_date && new Date(initiative.due_date) < now && initiative.status !== 'completed') {
        stats.overdue_count++
      }

      // Calculate completion time
      if (initiative.status === 'completed' && initiative.completed_at) {
        const created = new Date(initiative.created_at)
        const completed = new Date(initiative.completed_at)
        const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        completionTimes.push(days)
      }
    }

    // Calculate completion rate
    const totalInitiatives = initiatives.length
    if (totalInitiatives > 0) {
      stats.completion_rate = Math.round((stats.total_completed / totalInitiatives) * 100)
    }

    // Calculate average completion time
    if (completionTimes.length > 0) {
      stats.avg_completion_time_days = Math.round(
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      )
    }

    return stats
  }

  // Utility methods

  async getInitiativesByPersonId(personId: string): Promise<Initiative[]> {
    const result = await this.findMany({ person_id: personId }, { limit: 100 })
    return result.data.map(item => {
      const { person, change, ...initiative } = item
      return initiative
    })
  }

  async getPendingInitiativesForLeader(leaderId: string): Promise<InitiativeWithPerson[]> {
    const result = await this.findMany(
      { leader_id: leaderId, status: 'pending' },
      { orderBy: 'priority', orderDirection: 'desc' }
    )
    return result.data
  }

  async getOverdueInitiativesForLeader(leaderId: string): Promise<InitiativeWithPerson[]> {
    const now = new Date()
    const result = await this.findMany(
      { leader_id: leaderId, due_before: now },
      { orderBy: 'due_date', orderDirection: 'asc' }
    )
    return result.data.filter(initiative => initiative.status !== 'completed')
  }
}