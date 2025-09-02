import { BaseRepository } from './base.repository';
import { Initiative, InsertInitiative, UpdateInitiative } from '@/types/database';

export class InitiativeRepository extends BaseRepository<Initiative> {
  constructor(supabase: any) {
    super(supabase, 'initiatives');
  }

  async getById(id: string): Promise<Initiative | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getByLeader(leaderId: string, status?: string): Promise<Initiative[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getByPerson(personId: string): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getPending(leaderId: string): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getByStatus(leaderId: string, status: string): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getByPriority(leaderId: string, minPriority: number = 7): Promise<Initiative[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId)
      .gte('priority', minPriority)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getOverdue(leaderId: string): Promise<Initiative[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId)
      .eq('status', 'pending')
      .lt('due_date', now)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getDueSoon(leaderId: string, daysAhead: number = 3): Promise<Initiative[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('leader_id', leaderId)
      .eq('status', 'pending')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', futureDate.toISOString())
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async create(initiative: InsertInitiative): Promise<Initiative> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(initiative)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from create mutation');
    return data;
  }

  async update(id: string, updates: UpdateInitiative): Promise<Initiative> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update mutation');
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async markCompleted(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  async markInProgress(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  async updatePriority(id: string, priority: number): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ 
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  }

  async getWithDetails(initiativeId: string): Promise<{
    initiative: Initiative;
    person: any;
    leader: any;
    change?: any;
  } | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        people (*),
        leaders (*),
        people_changes (*)
      `)
      .eq('id', initiativeId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getStats(leaderId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    byType: Record<string, number>;
  }> {
    const allInitiatives = await this.getByLeader(leaderId);
    
    const stats = {
      total: allInitiatives.length,
      pending: allInitiatives.filter(i => i.status === 'pending').length,
      inProgress: allInitiatives.filter(i => i.status === 'in_progress').length,
      completed: allInitiatives.filter(i => i.status === 'completed').length,
      overdue: allInitiatives.filter(i => {
        if (i.status !== 'pending' || !i.due_date) return false;
        return new Date(i.due_date) < new Date();
      }).length,
      byType: {} as Record<string, number>
    };

    allInitiatives.forEach(initiative => {
      stats.byType[initiative.type] = (stats.byType[initiative.type] || 0) + 1;
    });

    return stats;
  }
}
