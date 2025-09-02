import { BaseRepository } from './base.repository';
import { Leader, InsertLeader, UpdateLeader } from '@/types/database';

export class LeaderRepository extends BaseRepository<Leader> {
  constructor(supabase: any) {
    super(supabase, 'leaders');
  }

  async getById(id: string): Promise<Leader | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async getByUserId(userId: string): Promise<Leader | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('supabase_user_id', userId)
        .single()
    );
  }

  async getByOrganization(organizationId: string): Promise<Leader[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')
    );
  }

  async create(leader: InsertLeader): Promise<Leader> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .insert(leader)
        .select()
        .single()
    );
  }

  async update(id: string, updates: UpdateLeader): Promise<Leader> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<void> {
    return this.executeDelete(() =>
      this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
    );
  }

  async getByEmail(email: string): Promise<Leader | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single()
    );
  }

  async getWithOrganization(leaderId: string): Promise<{ leader: Leader; organization: any } | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          organizations (*)
        `)
        .eq('id', leaderId)
        .single()
    );
  }
}
