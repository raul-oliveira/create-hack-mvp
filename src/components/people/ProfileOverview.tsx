'use client'

import { Person } from '@/lib/schemas/people'
import { InitiativeWithPerson } from '@/lib/schemas/initiatives'

interface ProfileStats {
  totalInitiatives: number
  completedInitiatives: number
  pendingInitiatives: number
  lastInteraction: any
  completionRate: number
}

interface ProfileOverviewProps {
  person: Person
  initiatives: InitiativeWithPerson[]
  stats: ProfileStats
}

export function ProfileOverview({ person, initiatives, stats }: ProfileOverviewProps) {
  const getRecentInitiatives = () => {
    return initiatives
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'text-red-600',
      'medium': 'text-orange-600',
      'low': 'text-blue-600'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome Completo</dt>
              <dd className="text-sm text-gray-900">{person.name}</dd>
            </div>
            
            {person.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{person.email}</dd>
              </div>
            )}
            
            {person.phone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                <dd className="text-sm text-gray-900">{person.phone}</dd>
              </div>
            )}
            
            {person.birth_date && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Nascimento</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(person.birth_date).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
            
            {person.marital_status && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado Civil</dt>
                <dd className="text-sm text-gray-900">{person.marital_status}</dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Fonte de Dados</dt>
              <dd className="text-sm text-gray-900 flex items-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  person.sync_source === 'webhook' ? 'bg-green-100 text-green-800' : 
                  person.sync_source === 'daily_polling' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {person.sync_source === 'webhook' ? 'InChurch (Webhook)' :
                   person.sync_source === 'daily_polling' ? 'InChurch (Sync)' : 
                   'Manual'}
                </span>
                <span className="ml-2 text-gray-500">
                  {person.last_synced_at && `Atualizado em ${new Date(person.last_synced_at).toLocaleDateString('pt-BR')}`}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Pastoral Care Summary */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo do Cuidado Pastoral</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Taxa de Conclusão</span>
                <span className="text-lg font-bold text-indigo-600">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalInitiatives}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completedInitiatives}</div>
                <div className="text-xs text-gray-600">Concluídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingInitiatives}</div>
                <div className="text-xs text-gray-600">Pendentes</div>
              </div>
            </div>

            {stats.lastInteraction && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">Última Interação</div>
                <div className="text-sm text-blue-700 mt-1">
                  {stats.lastInteraction.type} - {new Date(stats.lastInteraction.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Initiatives */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Iniciativas Recentes</h3>
          <span className="text-sm text-gray-500">{getRecentInitiatives().length} de {stats.totalInitiatives}</span>
        </div>
        
        {getRecentInitiatives().length > 0 ? (
          <div className="space-y-3">
            {getRecentInitiatives().map((initiative) => (
              <div key={initiative.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(initiative.status)}`}>
                        {getStatusLabel(initiative.status)}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(initiative.priority)}`}>
                        {getPriorityLabel(initiative.priority)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{initiative.type}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{initiative.description}</p>
                    {initiative.whatsapp_message && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                        <span className="font-medium">WhatsApp:</span> {initiative.whatsapp_message.slice(0, 100)}...
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-xs text-gray-500">
                    <span>{new Date(initiative.created_at!).toLocaleDateString('pt-BR')}</span>
                    {initiative.due_date && (
                      <span className={`mt-1 ${
                        new Date(initiative.due_date) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-500'
                      }`}>
                        Vence: {new Date(initiative.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Nenhuma iniciativa registrada ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}