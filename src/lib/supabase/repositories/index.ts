export { OrganizationRepository } from './organization.repository';
export { LeaderRepository } from './leader.repository';
export { PersonRepository } from './person.repository';
export { PersonChangeRepository } from './person-change.repository';
export { InitiativeRepository } from './initiative.repository';
export { InitiativeFeedbackRepository } from './initiative-feedback.repository';
export { SyncLogRepository } from './sync-log.repository';
export { InteractionRepository } from './interaction.repository';
export { BaseRepository } from './base.repository';

import { SupabaseClient } from '@supabase/supabase-js';
import { OrganizationRepository } from './organization.repository';
import { LeaderRepository } from './leader.repository';
import { PersonRepository } from './person.repository';
import { PersonChangeRepository } from './person-change.repository';
import { InitiativeRepository } from './initiative.repository';
import { InitiativeFeedbackRepository } from './initiative-feedback.repository';
import { SyncLogRepository } from './sync-log.repository';
import { InteractionRepository } from './interaction.repository';

/**
 * Main repository class that provides access to all entity-specific repositories
 */
export class MainRepository {
  public organizations: OrganizationRepository;
  public leaders: LeaderRepository;
  public people: PersonRepository;
  public personChanges: PersonChangeRepository;
  public initiatives: InitiativeRepository;
  public initiativeFeedback: InitiativeFeedbackRepository;
  public syncLogs: SyncLogRepository;
  public interactions: InteractionRepository;

  constructor(supabase: SupabaseClient) {
    this.organizations = new OrganizationRepository(supabase);
    this.leaders = new LeaderRepository(supabase);
    this.people = new PersonRepository(supabase);
    this.personChanges = new PersonChangeRepository(supabase);
    this.initiatives = new InitiativeRepository(supabase);
    this.initiativeFeedback = new InitiativeFeedbackRepository(supabase);
    this.syncLogs = new SyncLogRepository(supabase);
    this.interactions = new InteractionRepository(supabase);
  }

  /**
   * Get the underlying Supabase client (useful for custom queries)
   */
  get client(): SupabaseClient {
    return (this.organizations as any).supabase;
  }

  /**
   * Utility method to get leader with organization details
   */
  async getLeaderWithOrganization(leaderId: string) {
    return this.leaders.getWithOrganization(leaderId);
  }

  /**
   * Utility method to get person with leader details
   */
  async getPersonWithLeader(personId: string) {
    return this.people.getWithLeader(personId);
  }

  /**
   * Utility method to get initiative with all related details
   */
  async getInitiativeWithDetails(initiativeId: string) {
    return this.initiatives.getWithDetails(initiativeId);
  }

  /**
   * Get comprehensive stats for a leader
   */
  async getLeaderStats(leaderId: string) {
    const [
      peopleCount,
      pendingInitiatives,
      unprocessedChanges,
      initiativeStats,
      changeStats
    ] = await Promise.all([
      this.people.getByLeader(leaderId).then(p => p.length),
      this.initiatives.getPending(leaderId).then(i => i.length),
      this.personChanges.getUnprocessed(leaderId).then(c => c.length),
      this.initiatives.getStats(leaderId),
      this.personChanges.getStats(leaderId)
    ]);

    return {
      people: {
        total: peopleCount
      },
      initiatives: initiativeStats,
      changes: changeStats,
      summary: {
        totalPeople: peopleCount,
        pendingInitiatives,
        unprocessedChanges,
        overdueInitiatives: initiativeStats.overdue
      }
    };
  }

  /**
   * Get comprehensive stats for an organization
   */
  async getOrganizationStats(organizationId: string) {
    const [
      leaders,
      people,
      syncStats
    ] = await Promise.all([
      this.leaders.getByOrganization(organizationId),
      this.people.getByOrganization(organizationId),
      this.syncLogs.getStats(organizationId)
    ]);

    return {
      leaders: {
        total: leaders.length
      },
      people: {
        total: people.length
      },
      sync: syncStats
    };
  }
}
