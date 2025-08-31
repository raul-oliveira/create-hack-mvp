import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PeopleList } from '@/components/people/PeopleList'
import { AddPersonButton } from '@/components/people/AddPersonButton'
import { PeopleStats } from '@/components/people/PeopleStats'

export default async function PeoplePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get leader and organization info
  const { data: leader, error } = await supabase
    .from('leaders')
    .select('id, organization_id, name, organizations(name)')
    .eq('supabase_user_id', user.id)
    .single()

  if (error || !leader) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Perfil de líder não encontrado
          </h2>
          <p className="text-gray-600">
            Entre em contato com o administrador da sua igreja.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Liderados
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie as informações dos seus liderados
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <AddPersonButton 
                organizationId={leader.organization_id}
                leaderId={leader.id}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <Suspense fallback={
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        }>
          <PeopleStats 
            organizationId={leader.organization_id}
            leaderId={leader.id}
          />
        </Suspense>

        {/* People List */}
        <div className="bg-white shadow rounded-lg">
          <Suspense fallback={
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          }>
            <PeopleList 
              organizationId={leader.organization_id}
              leaderId={leader.id}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}