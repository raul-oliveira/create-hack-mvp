import { createServerSupabaseService } from '@/lib/supabase/service';
import { Person, InsertPerson, PersonChange, InsertPersonChange, SyncLog, InsertSyncLog } from '@/types/database';

export interface InChurchPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  marital_status?: string;
  address?: Record<string, any>;
  profile_data?: Record<string, any>;
  // Add other InChurch specific fields as needed
}

export class InChurchSyncService {
  private supabaseService: any;

  constructor() {
    // Initialize the service
    this.initializeService();
  }

  private async initializeService() {
    this.supabaseService = await createServerSupabaseService();
  }

  /**
   * Sync people data from InChurch to local database
   */
  async syncPeopleFromInChurch(
    organizationId: string,
    leaderId: string,
    inchurchPeople: InChurchPerson[]
  ): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    // Create sync log
    const syncLog = await this.supabaseService.syncLogs.create({
      organization_id: organizationId,
      sync_type: 'inchurch_people',
      status: 'running',
      records_processed: 0
    });

    const startTime = Date.now();

    try {
      for (const inchurchPerson of inchurchPeople) {
        try {
          // Check if person already exists
          const existingPerson = await this.supabaseService.people.getByInChurchId(
            inchurchPerson.id,
            organizationId
          );

          const personData: InsertPerson = {
            organization_id: organizationId,
            leader_id: leaderId,
            inchurch_member_id: inchurchPerson.id,
            name: inchurchPerson.name,
            email: inchurchPerson.email,
            phone: inchurchPerson.phone,
            birth_date: inchurchPerson.birth_date,
            marital_status: inchurchPerson.marital_status,
            address: inchurchPerson.address,
            profile_data: inchurchPerson.profile_data || {},
            sync_source: 'inchurch',
            last_synced_at: new Date().toISOString()
          };

          if (existingPerson) {
            // Check for changes
            const changes = this.detectChanges(existingPerson, personData);
            
            if (changes.length > 0) {
              // Update person
              await this.supabaseService.people.update(existingPerson.id, personData);
              
              // Create change records
              for (const change of changes) {
                await this.supabaseService.personChanges.create({
                  person_id: existingPerson.id,
                  change_type: change.type,
                  old_value: change.oldValue,
                  new_value: change.newValue,
                  urgency_score: this.calculateUrgencyScore(change.type)
                });
              }
            }
          } else {
            // Create new person
            await this.supabaseService.people.create(personData);
          }

          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync person ${inchurchPerson.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      // Update sync log as completed
      const executionTime = Date.now() - startTime;
      await this.supabaseService.syncLogs.complete(syncLog.id, synced, executionTime);

      return { synced, errors };
    } catch (error) {
      // Update sync log as failed
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.supabaseService.syncLogs.complete(syncLog.id, synced, executionTime, errorMessage);
      
      throw error;
    }
  }

  /**
   * Detect changes between existing and new person data
   */
  private detectChanges(existingPerson: Person, newData: InsertPerson): Array<{
    type: string;
    oldValue: any;
    newValue: any;
  }> {
    const changes: Array<{
      type: string;
      oldValue: any;
      newValue: any;
    }> = [];

    // Check name changes
    if (existingPerson.name !== newData.name) {
      changes.push({
        type: 'name_change',
        oldValue: existingPerson.name,
        newValue: newData.name
      });
    }

    // Check email changes
    if (existingPerson.email !== newData.email) {
      changes.push({
        type: 'email_change',
        oldValue: existingPerson.email,
        newValue: newData.email
      });
    }

    // Check phone changes
    if (existingPerson.phone !== newData.phone) {
      changes.push({
        type: 'phone_change',
        oldValue: existingPerson.phone,
        newValue: newData.phone
      });
    }

    // Check birth date changes
    if (existingPerson.birth_date !== newData.birth_date) {
      changes.push({
        type: 'birth_date_change',
        oldValue: existingPerson.birth_date,
        newValue: newData.birth_date
      });
    }

    // Check marital status changes
    if (existingPerson.marital_status !== newData.marital_status) {
      changes.push({
        type: 'marital_status_change',
        oldValue: existingPerson.marital_status,
        newValue: newData.marital_status
      });
    }

    // Check address changes (deep comparison for JSON)
    if (JSON.stringify(existingPerson.address) !== JSON.stringify(newData.address)) {
      changes.push({
        type: 'address_change',
        oldValue: existingPerson.address,
        newValue: newData.address
      });
    }

    // Check profile data changes (deep comparison for JSON)
    if (JSON.stringify(existingPerson.profile_data) !== JSON.stringify(newData.profile_data)) {
      changes.push({
        type: 'profile_data_change',
        oldValue: existingPerson.profile_data,
        newValue: newData.profile_data
      });
    }

    return changes;
  }

  /**
   * Calculate urgency score for change types
   */
  private calculateUrgencyScore(changeType: string): number {
    const urgencyScores: Record<string, number> = {
      'phone_change': 8,
      'email_change': 7,
      'birth_date_change': 6,
      'marital_status_change': 8,
      'address_change': 5,
      'name_change': 4,
      'profile_data_change': 3
    };

    return urgencyScores[changeType] || 5;
  }

  /**
   * Get people that need to be synced (haven't been synced recently)
   */
  async getPeopleNeedingSync(organizationId: string, daysThreshold: number = 7): Promise<Person[]> {
    return this.supabaseService.people.getNeedingSync(organizationId, daysThreshold);
  }

  /**
   * Get sync statistics for an organization
   */
  async getSyncStats(organizationId: string): Promise<{
    totalPeople: number;
    lastSyncDate?: string;
    pendingChanges: number;
    syncErrors: number;
  }> {
    const people = await this.supabaseService.people.getByOrganization(organizationId);
    const syncLogs = await this.supabaseService.syncLogs.getByOrganization(organizationId, 10);
    
    const lastSyncLog = syncLogs.find((log: any) => log.status === 'completed');
    const failedSyncs = syncLogs.filter((log: any) => log.status === 'failed').length;
    
    // Get pending changes count
    let pendingChanges = 0;
    for (const person of people) {
      const changes = await this.supabaseService.personChanges.getByPerson(person.id);
      pendingChanges += changes.filter((change: any) => !change.processed_at).length;
    }

    return {
      totalPeople: people.length,
      lastSyncDate: lastSyncLog?.completed_at,
      pendingChanges,
      syncErrors: failedSyncs
    };
  }
}
