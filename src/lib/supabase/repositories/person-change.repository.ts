import { BaseRepository } from './base.repository';
import { PersonChange, InsertPersonChange, UpdatePersonChange } from '@/types/database';

export class PersonChangeRepository extends BaseRepository<PersonChange> {
  constructor(supabase: any) {
    super(supabase, 'people_changes');
  }

  async getById(id: string): Promise<PersonChange | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async getByPerson(personId: string): Promise<PersonChange[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('person_id', personId)
        .order('detected_at', { ascending: false })
    );
  }

  async getUnprocessed(leaderId: string): Promise<PersonChange[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          people!inner(leader_id)
        `)
        .eq('people.leader_id', leaderId)
        .is('processed_at', null)
        .order('detected_at', { ascending: false })
    );
  }

  async getByChangeType(changeType: string, leaderId: string): Promise<PersonChange[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          people!inner(leader_id)
        `)
        .eq('people.leader_id', leaderId)
        .eq('change_type', changeType)
        .order('detected_at', { ascending: false })
    );
  }

  async getHighPriority(leaderId: string, minUrgencyScore: number = 7): Promise<PersonChange[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          people!inner(leader_id)
        `)
        .eq('people.leader_id', leaderId)
        .gte('urgency_score', minUrgencyScore)
        .is('processed_at', null)
        .order('urgency_score', { ascending: false })
        .order('detected_at', { ascending: false })
    );
  }

  async create(change: InsertPersonChange): Promise<PersonChange> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .insert(change)
        .select()
        .single()
    );
  }

  async update(id: string, updates: UpdatePersonChange): Promise<PersonChange> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async markAsProcessed(id: string): Promise<void> {
    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .update({ processed_at: new Date().toISOString() })
        .eq('id', id)
    );
  }

  async markMultipleAsProcessed(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .update({ processed_at: new Date().toISOString() })
        .in('id', ids)
    );
  }

  async getStats(leaderId: string): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    byType: Record<string, number>;
  }> {
    const allChanges = await this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          people!inner(leader_id)
        `)
        .eq('people.leader_id', leaderId)
    );

    const stats = {
      total: allChanges.length,
      processed: allChanges.filter(c => c.processed_at).length,
      unprocessed: allChanges.filter(c => !c.processed_at).length,
      byType: {} as Record<string, number>
    };

    allChanges.forEach(change => {
      stats.byType[change.change_type] = (stats.byType[change.change_type] || 0) + 1;
    });

    return stats;
  }

  async deleteOldProcessed(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .not('processed_at', 'is', null)
      .lt('processed_at', cutoffDate.toISOString())
      .select('id');

    if (error) this.handleError(error);
    return data?.length || 0;
  }
}
