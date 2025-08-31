import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunicationHub } from '@/components/communication/CommunicationHub'

export default async function CommunicationPage() {
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
          <CommunicationHub 
            organizationId={leader.organization_id}
            leaderId={leader.id}
          />
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