// Example usage of the Interaction repository
// This file demonstrates how to use the new Interaction repository

import { createSupabaseService } from '@/lib/supabase/service';

async function interactionExamples() {
  const supabaseService = await createSupabaseService();
  const { interactions } = supabaseService;

  console.log('=== Interaction Repository Examples ===\n');

  // 1. Create a new interaction
  console.log('1. Creating a new interaction...');
  try {
    const newInteraction = await interactions.create({
      profile_id: 'profile-uuid-123',
      person_id: 'person@email.com',
      type: 'meeting',
      status: 'todo',
      description: 'Weekly check-in meeting',
      date: '2024-01-15'
    });
    console.log('✅ Interaction created:', newInteraction);
  } catch (error) {
    console.error('❌ Error creating interaction:', error);
  }

  // 2. Get people with pending interactions (ordered by date ASC)
  console.log('\n2. Getting people with pending interactions...');
  try {
    const peopleWithPending = await interactions.getPeopleWithPendingInteractions();
    console.log('✅ People with pending interactions:', peopleWithPending);
    
    if (peopleWithPending.length > 0) {
      console.log('\n📋 Pending interactions summary:');
      peopleWithPending.forEach((person, index) => {
        console.log(`${index + 1}. ${person.first_name} ${person.last_name} - ${person.interaction_type} (${person.interaction_status}) - ${person.interaction_date}`);
      });
    }
  } catch (error) {
    console.error('❌ Error getting people with pending interactions:', error);
  }

  // 3. Get people with pending interactions for a specific profile
  console.log('\n3. Getting people with pending interactions for specific profile...');
  try {
    const peopleWithPendingForProfile = await interactions.getPeopleWithPendingInteractionsByProfile('profile-uuid-123');
    console.log('✅ People with pending interactions for profile:', peopleWithPendingForProfile);
  } catch (error) {
    console.error('❌ Error getting people with pending interactions for profile:', error);
  }

  // 4. Update interaction status
  console.log('\n4. Updating interaction status...');
  try {
    const updatedInteraction = await interactions.update('interaction-id-123', {
      status: 'done',
      feedback: 'Great meeting, person is doing well'
    });
    console.log('✅ Interaction updated:', updatedInteraction);
  } catch (error) {
    console.error('❌ Error updating interaction:', error);
  }

  // 5. Get interactions by status
  console.log('\n5. Getting interactions by status...');
  try {
    const todoInteractions = await interactions.getByStatus('todo');
    const pendingInteractions = await interactions.getByStatus('pending');
    const doneInteractions = await interactions.getByStatus('done');
    
    console.log('✅ Todo interactions:', todoInteractions.length);
    console.log('✅ Pending interactions:', pendingInteractions.length);
    console.log('✅ Done interactions:', doneInteractions.length);
  } catch (error) {
    console.error('❌ Error getting interactions by status:', error);
  }

  // 6. Get interactions for a specific person
  console.log('\n6. Getting interactions for a specific person...');
  try {
    const personInteractions = await interactions.getByPersonId('person@email.com');
    console.log('✅ Person interactions:', personInteractions);
  } catch (error) {
    console.error('❌ Error getting person interactions:', error);
  }

  // 7. Get interactions for a specific profile
  console.log('\n7. Getting interactions for a specific profile...');
  try {
    const profileInteractions = await interactions.getByProfileId('profile-uuid-123');
    console.log('✅ Profile interactions:', profileInteractions);
  } catch (error) {
    console.error('❌ Error getting profile interactions:', error);
  }
}

// Example of how to use in a real application
async function getDashboardData(profileId: string) {
  const supabaseService = await createSupabaseService();
  const { interactions } = supabaseService;

  try {
    // Get all pending interactions for the current profile
    const pendingInteractions = await interactions.getPeopleWithPendingInteractionsByProfile(profileId);
    
    // Group by status for dashboard display
    const todoCount = pendingInteractions.filter(p => p.interaction_status === 'todo').length;
    const pendingCount = pendingInteractions.filter(p => p.interaction_status === 'pending').length;
    
    return {
      pendingInteractions,
      summary: {
        todo: todoCount,
        pending: pendingCount,
        total: pendingInteractions.length
      }
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
}

export { interactionExamples, getDashboardData };
