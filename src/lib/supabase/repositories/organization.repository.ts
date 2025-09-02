import { BaseRepository } from './base.repository';
import { Organization, InsertOrganization, UpdateOrganization } from '@/types/database';

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(supabase: any) {
    super(supabase, 'organizations');
  }

  async getById(id: string): Promise<Organization | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async create(org: InsertOrganization): Promise<Organization> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .insert(org)
        .select()
        .single()
    );
  }

  async update(id: string, updates: UpdateOrganization): Promise<Organization> {
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

  async getAll(): Promise<Organization[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .order('name')
    );
  }

  async getByName(name: string): Promise<Organization | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('name', name)
        .single()
    );
  }
}
