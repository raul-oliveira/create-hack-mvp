import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LideradoProfile } from '@/components/people/LideradoProfile'

interface LideradoProfilePageProps {
  params: {
    id: string
  }
}

export default async function LideradoProfilePage({ params }: LideradoProfilePageProps) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get leader and organization info
  const { data: leader, error: leaderError } = await supabase
    .from('leaders')
    .select('id, organization_id, name')
    .eq('supabase_user_id', user.id)
    .single()

  if (leaderError || !leader) {
    redirect('/dashboard')
  }

  // Get the liderado (person) details
  const { data: person, error: personError } = await supabase
    .from('people')
    .select('*')
    .eq('id', params.id)
    .eq('leader_id', leader.id) // Security: only show people assigned to this leader
    .single()

  if (personError || !person) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={
          <div className="animate-pulse">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }>
          <LideradoProfile 
            person={person}
            leaderId={leader.id}
            organizationId={leader.organization_id}
          />
        </Suspense>
      </div>
    </div>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: LideradoProfilePageProps) {
  const supabase = await createClient()
  
  const { data: person } = await supabase
    .from('people')
    .select('name')
    .eq('id', params.id)
    .single()

  return {
    title: person ? `${person.name} - Perfil do Liderado` : 'Perfil do Liderado',
    description: person ? `Prontuário e histórico de ${person.name}` : 'Perfil de liderado'
  }
}