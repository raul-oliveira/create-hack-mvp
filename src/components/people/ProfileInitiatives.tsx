'use client'

import { useState } from 'react'
import { Person } from '@/lib/schemas/people'
import { InitiativeWithPerson } from '@/lib/schemas/initiatives'
import { InitiativeDetailModal } from '@/components/initiatives/InitiativeDetailModal'

interface ProfileInitiativesProps {
  person: Person
  initiatives: InitiativeWithPerson[]
  onInitiativeUpdate: (initiative: InitiativeWithPerson) => void
  leaderId: string
}

export function ProfileInitiatives({ person, initiatives, onInitiativeUpdate, leaderId }: ProfileInitiativesProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithPerson | null>(null)

  const getFilteredAndSortedInitiatives = () => {
    let filtered = initiatives.filter(initiative => {
      if (filter === 'all') return true
      return initiative.status === filter
    })

    return filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at!)
          bValue = new Date(b.created_at!)
          break
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date('2099-12-31')
          bValue = b.due_date ? new Date(b.due_date) : new Date('2099-12-31')
          break
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  const handleWhatsAppClick = (message: string, phone: string | null) => {
    if (!phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = phone.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCallClick = (phone: string | null) => {
    if (!phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = phone.replace(/\D/g, '')
    window.open(`tel:+55${phoneNumber}`, '_self')
  }

  const filteredInitiatives = getFilteredAndSortedInitiatives()

  return (
    <>
      <div className="p-6">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'all', label: 'Todas', count: initiatives.length },
              { id: 'pending', label: 'Pendentes', count: initiatives.filter(i => i.status === 'pending').length },
              { id: 'in_progress', label: 'Em Andamento', count: initiatives.filter(i => i.status === 'in_progress').length },
              { id: 'completed', label: 'Concluídas', count: initiatives.filter(i => i.status === 'completed').length },
              { id: 'cancelled', label: 'Canceladas', count: initiatives.filter(i => i.status === 'cancelled').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === tab.id ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="created_at">Data de Criação</option>
                <option value="due_date">Data de Vencimento</option>
                <option value="priority">Prioridade</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span>{sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sortOrder === 'asc' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V20m0 0l4-4m-4 4l-4-4M7 4v16m0 0L3 16m4 4l4-4" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Initiatives List */}
        {filteredInitiatives.length > 0 ? (
          <div className="space-y-4">
            {filteredInitiatives.map((initiative) => (
              <div key={initiative.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(initiative.status)}`}>
                        {getStatusLabel(initiative.status)}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(initiative.priority)}`}>
                        {getPriorityLabel(initiative.priority)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(initiative.created_at!).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{initiative.type}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{initiative.description}</p>
                    
                    {initiative.due_date && (
                      <div className="flex items-center text-xs mb-2">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className={`${
                          new Date(initiative.due_date) < new Date() && initiative.status !== 'completed'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        }`}>
                          {new Date(initiative.due_date) < new Date() && initiative.status !== 'completed' ? 'Vencida em: ' : 'Vence em: '}
                          {new Date(initiative.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {initiative.whatsapp_message && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                        <span className="font-medium text-green-800">WhatsApp:</span>
                        <span className="text-green-700 ml-1">
                          {initiative.whatsapp_message.length > 100 
                            ? `${initiative.whatsapp_message.slice(0, 100)}...` 
                            : initiative.whatsapp_message
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedInitiative(initiative)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Ver Detalhes
                    </button>
                    
                    {person.phone && (
                      <div className="flex flex-col space-y-1">
                        {initiative.whatsapp_message && (
                          <button
                            onClick={() => handleWhatsAppClick(initiative.whatsapp_message!, person.phone)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => handleCallClick(person.phone)}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Ligar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma iniciativa encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'Não há iniciativas registradas para este liderado ainda.'
                : `Não há iniciativas com status "${getStatusLabel(filter)}" para este liderado.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Initiative Detail Modal */}
      {selectedInitiative && (
        <InitiativeDetailModal
          initiative={selectedInitiative}
          isOpen={!!selectedInitiative}
          onClose={() => setSelectedInitiative(null)}
          onUpdate={(updated) => {
            onInitiativeUpdate(updated)
            setSelectedInitiative(null)
          }}
          leaderId={leaderId}
        />
      )}
    </>
  )
}