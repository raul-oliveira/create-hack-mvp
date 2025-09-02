import { createClient } from './client';
import { createClient as createServerClient } from './server';
import { MainRepository } from './repositories';

// Client-side service (for use in components, hooks, etc.)
export function createSupabaseService() {
  const supabase = createClient();
  return new MainRepository(supabase);
}

// Server-side service (for use in API routes, server components, etc.)
export async function createServerSupabaseService() {
  const supabase = await createServerClient();
  return new MainRepository(supabase);
}

// Export the repository classes for direct use if needed
export { MainRepository } from './repositories';
export { 
  OrganizationRepository,
  LeaderRepository,
  PersonRepository,
  PersonChangeRepository,
  InitiativeRepository,
  InitiativeFeedbackRepository,
  SyncLogRepository,
  BaseRepository
} from './repositories';
