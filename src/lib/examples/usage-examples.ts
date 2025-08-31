// Example usage of the Supabase repository and InChurch sync services
// This file demonstrates how to use the services in different contexts

import { createSupabaseService, createServerSupabaseService } from '@/lib/supabase/service';
import { InChurchSyncService } from '@/lib/services/inchurch-sync.service';

// ===== CLIENT-SIDE USAGE (in components, hooks, etc.) =====

export async function clientSideExamples() {
  const supabaseService = createSupabaseService();

  // Get current user's leader profile
  const currentUser = await supabaseService.leaders.getByUserId('user-uuid');
  
  if (currentUser) {
    // Get all people assigned to this leader
    const people = await supabaseService.people.getByLeader(currentUser.id);
    
    // Search for specific people
    const searchResults = await supabaseService.people.search('João', currentUser.id);
    
    // Get pending initiatives
    const pendingInitiatives = await supabaseService.initiatives.getPending(currentUser.id);
    
    // Get unprocessed changes
    const unprocessedChanges = await supabaseService.personChanges.getUnprocessed(currentUser.id);
  }
}

// ===== SERVER-SIDE USAGE (in API routes, server components, etc.) =====

export async function serverSideExamples() {
  const supabaseService = await createServerSupabaseService();

  // Create a new organization
  const organization = await supabaseService.organizations.create({
    name: 'Minha Igreja',
    settings: { timezone: 'America/Sao_Paulo' }
  });

  // Create a leader
  const leader = await supabaseService.leaders.create({
    organization_id: organization.id,
    supabase_user_id: 'user-uuid',
    email: 'lider@igreja.com',
    name: 'João Líder',
    tone_config: { formal: true, friendly: true },
    notification_preferences: { email: true, push: false }
  });

  // Create a person
  const person = await supabaseService.people.create({
    organization_id: organization.id,
    leader_id: leader.id,
    name: 'Maria Discípula',
    email: 'maria@email.com',
    phone: '+5511999999999',
    sync_source: 'manual',
    profile_data: {}
  });

  // Create an initiative
  const initiative = await supabaseService.initiatives.create({
    organization_id: organization.id,
    leader_id: leader.id,
    person_id: person.id,
    type: 'follow_up',
    title: 'Acompanhamento semanal',
    description: 'Verificar como está indo o discipulado',
    priority: 8,
    status: 'pending'
  });
}

// ===== INCHURCH SYNC USAGE =====

export async function inchurchSyncExamples() {
  const inchurchService = new InChurchSyncService();

  // Example InChurch people data
  const inchurchPeople = [
    {
      id: 'inchurch-001',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '+5511999999999',
      birth_date: '1990-05-15',
      marital_status: 'married',
      address: {
        street: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP'
      },
      profile_data: {
        cell_group: 'Célula Centro',
        baptism_date: '2015-03-20'
      }
    },
    {
      id: 'inchurch-002',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '+5511888888888',
      birth_date: '1985-08-22',
      marital_status: 'single',
      profile_data: {
        cell_group: 'Célula Norte',
        ministry: 'Louvor'
      }
    }
  ];

  // Sync people from InChurch
  const result = await inchurchService.syncPeopleFromInChurch(
    'org-uuid',
    'leader-uuid',
    inchurchPeople
  );

  console.log(`Synced ${result.synced} people`);
  if (result.errors.length > 0) {
    console.error('Sync errors:', result.errors);
  }

  // Get sync statistics
  const stats = await inchurchService.getSyncStats('org-uuid');
  console.log('Sync stats:', stats);
}

// ===== COMPLEX QUERIES WITH RELATIONS =====

export async function complexQueryExamples() {
  const supabaseService = await createServerSupabaseService();

  // Get leader with organization details
  const leaderWithOrg = await supabaseService.getLeaderWithOrganization('leader-uuid');
  if (leaderWithOrg) {
    console.log('Leader:', leaderWithOrg.leader.name);
    console.log('Organization:', leaderWithOrg.organization.name);
  }

  // Get person with leader details
  const personWithLeader = await supabaseService.getPersonWithLeader('person-uuid');
  if (personWithLeader) {
    console.log('Person:', personWithLeader.person.name);
    console.log('Assigned to:', personWithLeader.leader.name);
  }

  // Get initiative with all related details
  const initiativeWithDetails = await supabaseService.getInitiativeWithDetails('initiative-uuid');
  if (initiativeWithDetails) {
    console.log('Initiative:', initiativeWithDetails.initiative.title);
    console.log('For person:', initiativeWithDetails.person.name);
    console.log('Assigned to leader:', initiativeWithDetails.leader.name);
    if (initiativeWithDetails.change) {
      console.log('Triggered by change:', initiativeWithDetails.change.change_type);
    }
  }
}

// ===== ENTITY-SPECIFIC REPOSITORY USAGE =====

export async function entitySpecificExamples() {
  const supabaseService = await createServerSupabaseService();

  // Organization operations
  const org = await supabaseService.organizations.getByName('Minha Igreja');
  if (org) {
    await supabaseService.organizations.update(org.id, {
      settings: { ...org.settings, theme: 'dark' }
    });
  }

  // Leader operations
  const leader = await supabaseService.leaders.getByEmail('lider@igreja.com');
  if (leader) {
    const leadersInOrg = await supabaseService.leaders.getByOrganization(leader.organization_id);
    console.log(`Organization has ${leadersInOrg.length} leaders`);
  }

  // Person operations
  const people = await supabaseService.people.getByLeader('leader-uuid');
  const searchResults = await supabaseService.people.search('João', 'leader-uuid');
  
  // Person change operations
  const unprocessedChanges = await supabaseService.personChanges.getUnprocessed('leader-uuid');
  const highPriorityChanges = await supabaseService.personChanges.getHighPriority('leader-uuid', 8);
  const changeStats = await supabaseService.personChanges.getStats('leader-uuid');

  // Initiative operations
  const pendingInitiatives = await supabaseService.initiatives.getPending('leader-uuid');
  const overdueInitiatives = await supabaseService.initiatives.getOverdue('leader-uuid');
  const dueSoonInitiatives = await supabaseService.initiatives.getDueSoon('leader-uuid', 3);
  const initiativeStats = await supabaseService.initiatives.getStats('leader-uuid');

  // Initiative feedback operations
  const feedbackNeedingFollowUp = await supabaseService.initiativeFeedback.getNeedingFollowUp('leader-uuid');
  const feedbackStats = await supabaseService.initiativeFeedback.getStats('leader-uuid');

  // Sync log operations
  const recentFailures = await supabaseService.syncLogs.getRecentFailures('org-uuid', 7);
  const syncStats = await supabaseService.syncLogs.getStats('org-uuid');
  const longRunningSyncs = await supabaseService.syncLogs.getLongRunningSyncs('org-uuid', 60);
}

// ===== COMPREHENSIVE STATS =====

export async function comprehensiveStatsExamples() {
  const supabaseService = await createServerSupabaseService();

  // Get comprehensive leader stats
  const leaderStats = await supabaseService.getLeaderStats('leader-uuid');
  console.log('Leader stats:', leaderStats);

  // Get comprehensive organization stats
  const orgStats = await supabaseService.getOrganizationStats('org-uuid');
  console.log('Organization stats:', orgStats);
}

// ===== ERROR HANDLING EXAMPLES =====

export async function errorHandlingExamples() {
  const supabaseService = createSupabaseService();

  try {
    // Try to get a person that doesn't exist
    const person = await supabaseService.people.getById('non-existent-uuid');
    if (!person) {
      console.log('Person not found');
    }
  } catch (error) {
    console.error('Error fetching person:', error);
  }

  try {
    // Try to create a person with invalid data
    const person = await supabaseService.people.create({
      organization_id: 'invalid-uuid',
      leader_id: 'invalid-uuid',
      name: '', // Empty name should fail
      sync_source: 'manual',
      profile_data: {}
    });
  } catch (error) {
    console.error('Error creating person:', error);
    // Handle validation errors, foreign key constraints, etc.
  }
}

// ===== BATCH OPERATIONS =====

export async function batchOperationsExample() {
  const supabaseService = await createServerSupabaseService();

  // Create multiple people at once
  const peopleToCreate = [
    {
      organization_id: 'org-uuid',
      leader_id: 'leader-uuid',
      name: 'Ana Silva',
      email: 'ana@email.com',
      sync_source: 'manual',
      profile_data: {}
    },
    {
      organization_id: 'org-uuid',
      leader_id: 'leader-uuid',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      sync_source: 'manual',
      profile_data: {}
    }
  ];

  const createdPeople = [];
  for (const personData of peopleToCreate) {
    try {
      const person = await supabaseService.people.create(personData);
      createdPeople.push(person);
    } catch (error) {
      console.error(`Failed to create person ${personData.name}:`, error);
    }
  }

  console.log(`Successfully created ${createdPeople.length} people`);
}

// ===== REAL-TIME SUBSCRIPTIONS (if needed) =====

export function realTimeSubscriptionExample() {
  const supabaseService = createSupabaseService();
  
  // Subscribe to changes in people table for a specific leader
  const subscription = supabaseService.client
    .channel('people-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'people',
        filter: `leader_id=eq.${'leader-uuid'}`
      },
      (payload) => {
        console.log('People table changed:', payload);
        // Handle real-time updates
      }
    )
    .subscribe();

  // Return subscription for cleanup
  return subscription;
}
