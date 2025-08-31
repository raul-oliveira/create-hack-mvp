import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { CommunicationHub } from '@/components/communication/CommunicationHub'
import { DashboardNav } from '@/components/navigation/DashboardNav'
import { getUserProfile, createDefaultLeaderProfile } from '@/lib/auth/user-profile'

export default async function CommunicationPage() {
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
                Central de Comunicação
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Gerencie suas comunicações com os liderados de forma eficiente
              </p>
            </div>
          </div>
        </div>

        {/* Communication Hub */}
        <Suspense fallback={
          <div className="space-y-6">
            {/* Stats Loading */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Content Loading */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          {hasInChurchProfile ? (
            <CommunicationHub 
              organizationId={effectiveLeader.organization_id}
              leaderId={effectiveLeader.id}
            />
          ) : (
            <div className="space-y-6">
              {/* Stats without data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Mensagens Enviadas</div>
                  <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Taxa de Resposta</div>
                  <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Pendentes</div>
                  <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm font-medium text-gray-500">Este Mês</div>
                  <div className="mt-2 text-3xl font-bold text-gray-400">-</div>
                </div>
              </div>
              
              {/* No InChurch message */}
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Conecte-se à InChurch
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Para utilizar a central de comunicação, você precisa conectar seu perfil à plataforma InChurch da sua igreja.
                </p>
                <p className="text-sm text-gray-400">
                  Entre em contato com o administrador da sua igreja para configurar a integração.
                </p>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}

// Generate metadata for the page
export const metadata = {
  title: 'Central de Comunicação - Church Leader Assistant',
  description: 'Gerencie suas comunicações com os liderados de forma eficiente'
}