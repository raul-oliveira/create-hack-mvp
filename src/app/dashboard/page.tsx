import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Assistente do Líder de Célula
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user.user_metadata?.full_name || user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bem-vindo ao seu Dashboard!
              </h2>
              <p className="text-gray-600 mb-6">
                Aqui você poderá gerenciar seus liderados e acompanhar suas iniciativas pastorais.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Liderados</h3>
                  <p className="text-gray-600 text-sm">
                    Gerencie informações dos seus liderados
                  </p>
                  <div className="mt-4 text-2xl font-bold text-indigo-600">0</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Iniciativas</h3>
                  <p className="text-gray-600 text-sm">
                    Acompanhe suas ações pastorais
                  </p>
                  <div className="mt-4 text-2xl font-bold text-green-600">0</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pendências</h3>
                  <p className="text-gray-600 text-sm">
                    Itens que precisam de atenção
                  </p>
                  <div className="mt-4 text-2xl font-bold text-yellow-600">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}