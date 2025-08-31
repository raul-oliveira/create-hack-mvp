import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { InitiativesDashboard } from '@/components/initiatives/InitiativesDashboard'
import { InitiativesStats } from '@/components/initiatives/InitiativesStats'
import { DashboardNav } from '@/components/navigation/DashboardNav'
import { getUserProfile, createDefaultLeaderProfile } from '@/lib/auth/user-profile'

export default async function InitiativesPage() {
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
                Iniciativas Pastorais
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie suas ações de cuidado pastoral com os liderados
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <Suspense fallback={
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
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
            <InitiativesStats leaderId={effectiveLeader.id} />
          ) : (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Pendentes</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Em Andamento</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Concluídas</div>
                <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
              </div>
            </div>
          )}
        </Suspense>

        {/* Initiatives Dashboard */}
        <div className="bg-white shadow rounded-lg">
          <Suspense fallback={
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          }>
            {hasInChurchProfile ? (
              <InitiativesDashboard 
                leaderId={effectiveLeader.id}
                organizationId={effectiveLeader.organization_id}
              />
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Conecte-se à InChurch
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Para gerenciar iniciativas pastorais baseadas nos dados dos seus liderados, você precisa conectar seu perfil à plataforma InChurch da sua igreja.
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