import { BaseRepository } from './base.repository';
import { InitiativeFeedback, InsertInitiativeFeedback, UpdateInitiativeFeedback } from '@/types/database';

export class InitiativeFeedbackRepository extends BaseRepository<InitiativeFeedback> {
  constructor(supabase: any) {
    super(supabase, 'initiative_feedback');
  }

  async getByInitiativeId(initiativeId: string): Promise<InitiativeFeedback | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('initiative_id', initiativeId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async create(feedback: InsertInitiativeFeedback): Promise<InitiativeFeedback> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(feedback)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from create mutation');
    return data;
  }

  async update(initiativeId: string, updates: UpdateInitiativeFeedback): Promise<InitiativeFeedback> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('initiative_id', initiativeId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from update mutation');
    return data;
  }

  async delete(initiativeId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('initiative_id', initiativeId);
    
    if (error) throw error;
  }

  async getByOutcome(outcome: string, leaderId: string): Promise<InitiativeFeedback[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        initiatives!inner(leader_id)
      `)
      .eq('initiatives.leader_id', leaderId)
      .eq('outcome', outcome)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getNeedingFollowUp(leaderId: string): Promise<InitiativeFeedback[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        initiatives!inner(leader_id)
      `)
      .eq('initiatives.leader_id', leaderId)
      .eq('follow_up_needed', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getByResponseStatus(leaderId: string, responseReceived: boolean): Promise<InitiativeFeedback[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        initiatives!inner(leader_id)
      `)
      .eq('initiatives.leader_id', leaderId)
      .eq('response_received', responseReceived)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getStats(leaderId: string): Promise<{
    total: number;
    withResponse: number;
    withoutResponse: number;
    needingFollowUp: number;
    byOutcome: Record<string, number>;
  }> {
    const { data: allFeedback, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        initiatives!inner(leader_id)
      `)
      .eq('initiatives.leader_id', leaderId);
    
    if (error) throw error;
    const feedbackArray = allFeedback || [];

    const stats = {
      total: feedbackArray.length,
      withResponse: feedbackArray.filter(f => f.response_received).length,
      withoutResponse: feedbackArray.filter(f => !f.response_received).length,
      needingFollowUp: feedbackArray.filter(f => f.follow_up_needed).length,
      byOutcome: {} as Record<string, number>
    };

    feedbackArray.forEach(feedback => {
      stats.byOutcome[feedback.outcome] = (stats.byOutcome[feedback.outcome] || 0) + 1;
    });

    return stats;
  }
}
