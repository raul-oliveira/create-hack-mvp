import { BaseRepository } from './base.repository';

export interface Interaction {
  id: string;
  profile_id: string;
  person_id: string;
  type: 'meeting' | 'visit' | 'event';
  status: 'todo' | 'pending' | 'done';
  description?: string;
  feedback?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface PersonWithInteraction {
  email: string;
  first_name: string;
  last_name: string;
  interaction_id: string;
  interaction_type: string;
  interaction_status: string;
  interaction_date: string;
  interaction_description?: string;
}

export class InteractionRepository extends BaseRepository<Interaction> {
  constructor(supabase: any) {
    super(supabase, 'interactions');
  }

  async create(interaction: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>): Promise<Interaction> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(interaction)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('No data returned from create mutation');
    return data;
  }

  async update(id: string, updates: Partial<Interaction>): Promise<Interaction> {
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

  async getById(id: string): Promise<Interaction | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getByProfileId(profileId: string): Promise<Interaction[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('profile_id', profileId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getByPersonId(personId: string): Promise<Interaction[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('person_id', personId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getByStatus(status: 'todo' | 'pending' | 'done'): Promise<Interaction[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getPeopleWithPendingInteractions(): Promise<PersonWithInteraction[]> {
    const { data: people, error } = await this.supabase
      .from('people')
      .select(`
        email,
        first_name,
        last_name,
        interactions!inner(
          id,
          type,
          status,
          date,
          description
        )
      `)
      .eq('interactions.status', 'todo')
      .or('interactions.status.eq.pending')
      .order('interactions.date', { ascending: true });
    
    if (error) throw error;
    
    // Transform the nested structure to flatten it
    return people?.flatMap(person => 
      person.interactions?.map((interaction: any) => ({
        email: person.email,
        first_name: person.first_name,
        last_name: person.last_name,
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        interaction_status: interaction.status,
        interaction_date: interaction.date,
        interaction_description: interaction.description
      })) || []
    ) || [];
  }

  async getPeopleWithPendingInteractionsByProfile(profileId: string): Promise<PersonWithInteraction[]> {
    const { data: people, error } = await this.supabase
      .from('people')
      .select(`
        email,
        first_name,
        last_name,
        interactions!inner(
          id,
          type,
          status,
          date,
          description
        )
      `)
      .eq('interactions.profile_id', profileId)
      .eq('interactions.status', 'todo')
      .or('interactions.status.eq.pending')
      .order('interactions.date', { ascending: true });
    
    if (error) throw error;
    
    // Transform the nested structure to flatten it
    return people?.flatMap(person => 
      person.interactions?.map((interaction: any) => ({
        email: person.email,
        first_name: person.first_name,
        last_name: person.last_name,
        interaction_id: interaction.id,
        interaction_type: interaction.type,
        interaction_status: interaction.status,
        interaction_date: interaction.date,
        interaction_description: interaction.description
      })) || []
    ) || [];
  }
}
