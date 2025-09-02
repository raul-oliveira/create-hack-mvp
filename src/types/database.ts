export interface Organization {
  id: string;
  name: string;
  inchurch_api_key?: string;
  inchurch_secret?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Leader {
  id: string;
  organization_id: string;
  supabase_user_id: string;
  email: string;
  name: string;
  inchurch_member_id?: string;
  tone_config: Record<string, any>;
  notification_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  organization_id: string;
  leader_id: string;
  inchurch_member_id?: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  marital_status?: string;
  address?: Record<string, any>;
  profile_data: Record<string, any>;
  sync_source: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonChange {
  id: string;
  person_id: string;
  change_type: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  detected_at: string;
  processed_at?: string;
  urgency_score?: number;
  ai_analysis?: Record<string, any>;
}

export interface Initiative {
  id: string;
  organization_id: string;
  leader_id: string;
  person_id: string;
  change_id?: string;
  type: string;
  title: string;
  description?: string;
  suggested_message?: string;
  edited_message?: string;
  status: string;
  priority: number;
  due_date?: string;
  completed_at?: string;
  whatsapp_clicked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InitiativeFeedback {
  id: string;
  initiative_id: string;
  outcome: string;
  notes?: string;
  response_received: boolean;
  follow_up_needed: boolean;
  created_at: string;
}

export interface SyncLog {
  id: string;
  organization_id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  error_message?: string;
  execution_time_ms?: number;
  started_at: string;
  completed_at?: string;
}

// Insert types (without auto-generated fields)
export type InsertOrganization = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type InsertLeader = Omit<Leader, 'id' | 'created_at' | 'updated_at'>;
export type InsertPerson = Omit<Person, 'id' | 'created_at' | 'updated_at'>;
export type InsertPersonChange = Omit<PersonChange, 'id' | 'detected_at'>;
export type InsertInitiative = Omit<Initiative, 'id' | 'created_at' | 'updated_at'>;
export type InsertInitiativeFeedback = Omit<InitiativeFeedback, 'id' | 'created_at'>;
export type InsertSyncLog = Omit<SyncLog, 'id' | 'started_at'>;

// Update types (without auto-generated fields)
export type UpdateOrganization = Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateLeader = Partial<Omit<Leader, 'id' | 'created_at' | 'updated_at'>>;
export type UpdatePerson = Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>;
export type UpdatePersonChange = Partial<Omit<PersonChange, 'id' | 'detected_at'>>;
export type UpdateInitiative = Partial<Omit<Initiative, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateInitiativeFeedback = Partial<Omit<InitiativeFeedback, 'id' | 'created_at'>>;
export type UpdateSyncLog = Partial<Omit<SyncLog, 'id' | 'started_at'>>;
