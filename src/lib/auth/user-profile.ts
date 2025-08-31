import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  user: {
    id: string
    email: string | undefined
    user_metadata?: {
      full_name?: string
    }
  }
  leader?: {
    id: string
    organization_id: string
    name: string
    organizations?: {
      name: string
    }
  }
  hasInChurchProfile: boolean
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Try to get leader profile, but don't fail if it doesn't exist
  const { data: leader, error } = await supabase
    .from('leaders')
    .select('id, organization_id, name, organizations(name)')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  return {
    user,
    leader: leader || undefined,
    hasInChurchProfile: !!leader && !error
  }
}

export function createDefaultLeaderProfile(userId: string): {
  id: string
  organization_id: string
  name: string
} {
  return {
    id: `temp-leader-${userId}`,
    organization_id: `temp-org-${userId}`,
    name: 'Perfil Temporário'
  }
}
