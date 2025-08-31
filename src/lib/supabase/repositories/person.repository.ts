import { BaseRepository } from './base.repository';
import { Person, InsertPerson, UpdatePerson } from '@/types/database';

export class PersonRepository extends BaseRepository<Person> {
  constructor(supabase: any) {
    super(supabase, 'people');
  }

  async getById(id: string): Promise<Person | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async getByInChurchId(inchurchMemberId: string, organizationId: string): Promise<Person | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('inchurch_member_id', inchurchMemberId)
        .eq('organization_id', organizationId)
        .single()
    );
  }

  async getByLeader(leaderId: string): Promise<Person[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('leader_id', leaderId)
        .order('name')
    );
  }

  async getByOrganization(organizationId: string): Promise<Person[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')
    );
  }

  async search(query: string, leaderId: string): Promise<Person[]> {
    return this.executeQueryArray(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('leader_id', leaderId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name')
    );
  }

  async create(person: InsertPerson): Promise<Person> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .insert(person)
        .select()
        .single()
    );
  }

  async update(id: string, updates: UpdatePerson): Promise<Person> {
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

  async upsertByInChurchId(person: InsertPerson): Promise<Person> {
    return this.executeMutation(() =>
      this.supabase
        .from(this.tableName)
        .upsert(person, {
          onConflict: 'organization_id,inchurch_member_id',
          ignoreDuplicates: false
        })
        .select()
        .single()
    );
  }

  async getWithLeader(personId: string): Promise<{ person: Person; leader: any } | null> {
    return this.executeQuery(() =>
      this.supabase
        .from(this.tableName)
        .select(`
          *,
          leaders (*)
        `)
        .eq('id', personId)
        .single()
    );
  }

  async getNeedingSync(organizationId: string, daysThreshold: number = 7): Promise<Person[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const allPeople = await this.getByOrganization(organizationId);
    
    return allPeople.filter(person => {
      if (!person.last_synced_at) return true;
      return new Date(person.last_synced_at) < thresholdDate;
    });
  }
}
