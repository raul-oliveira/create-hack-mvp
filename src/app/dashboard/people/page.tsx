import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { PeopleList } from '@/components/people/PeopleList'
import { AddPersonButton } from '@/components/people/AddPersonButton'
import { PeopleStats } from '@/components/people/PeopleStats'
import { DashboardNav } from '@/components/navigation/DashboardNav'
import { getUserProfile, createDefaultLeaderProfile } from '@/lib/auth/user-profile'

export default async function PeoplePage() {
  const userProfile = await getUserProfile()

  if (!userProfile) {
    redirect('/login')
  }

  const { user, leader, hasInChurchProfile } = userProfile
  
  // If user doesn't have InChurch profile, create a temporary one for UI purposes
  const effectiveLeader = leader || createDefaultLeaderProfile(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav userName={user.user_metadata?.full_name || user.email || 'Usuário'} />
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
              {hasInChurchProfile ? (
                <AddPersonButton />
              ) : (
                <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  Para gerenciar liderados, conecte-se à InChurch
                </div>
              )}
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
          {hasInChurchProfile ? (
            <PeopleStats 
              organizationId={effectiveLeader.organization_id}
              leaderId={effectiveLeader.id}
            />
          ) : (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total de Liderados</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Ativos</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Novos este mês</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Pendências</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Última atualização</div>
                <div className="mt-2 text-sm text-gray-400">Nunca</div>
              </div>
            </div>
          )}
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
            {hasInChurchProfile ? (
              <PeopleList 
                organizationId={effectiveLeader.organization_id}
                leaderId={effectiveLeader.id}
              />
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Conecte-se à InChurch
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Para gerenciar seus liderados, você precisa conectar seu perfil à plataforma InChurch da sua igreja.
                </p>
                <p className="text-sm text-gray-400">
                  Entre em contato com o administrador da sua igreja para configurar a integração.
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}