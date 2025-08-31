'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CommunicationHistoryProps {
  organizationId: string
  leaderId: string
  refreshTrigger: number
}

interface CommunicationRecord {
  id: string
  type: 'whatsapp' | 'call' | 'email'
  personName: string
  personId: string
  message?: string
  timestamp: Date
  status: 'sent' | 'delivered' | 'read' | 'failed'
  initiativeId?: string
  initiativeTitle?: string
}

export function CommunicationHistory({ organizationId, leaderId, refreshTrigger }: CommunicationHistoryProps) {
  const [communications, setCommunications] = useState<CommunicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'whatsapp' | 'call' | 'email'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week')

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true)
        
        // Mock data - in real implementation would fetch from database
        const mockCommunications: CommunicationRecord[] = [
          {
            id: '1',
            type: 'whatsapp',
            personName: 'Maria Silva',
            personId: 'person-1',
            message: 'Olá Maria! Como você está? Gostaria de saber como foi sua semana e se precisa de alguma oração especial.',
            timestamp: new Date('2025-08-31T10:30:00'),
            status: 'read',
            initiativeId: 'init-1',
            initiativeTitle: 'Acompanhamento Semanal'
          },
          {
            id: '2',
            type: 'call',
            personName: 'João Santos',
            personId: 'person-2',
            timestamp: new Date('2025-08-31T09:15:00'),
            status: 'delivered',
            initiativeId: 'init-2',
            initiativeTitle: 'Visita Pastoral'
          },
          {
            id: '3',
            type: 'whatsapp',
            personName: 'Ana Costa',
            personId: 'person-3',
            message: 'Parabéns pelo seu aniversário Ana! Que Deus abençoe muito sua vida neste novo ano! 🎉🙏',
            timestamp: new Date('2025-08-30T16:45:00'),
            status: 'delivered',
            initiativeId: 'init-3',
            initiativeTitle: 'Aniversário'
          },
          {
            id: '4',
            type: 'whatsapp',
            personName: 'Pedro Oliveira',
            personId: 'person-4',
            message: 'Oi Pedro! Vi que você não veio no último culto. Está tudo bem? Queremos saber como podemos orar por você.',
            timestamp: new Date('2025-08-30T14:20:00'),
            status: 'sent',
          },
          {
            id: '5',
            type: 'call',
            personName: 'Lucia Fernandes',
            personId: 'person-5',
            timestamp: new Date('2025-08-29T11:10:00'),
            status: 'delivered',
            initiativeId: 'init-4',
            initiativeTitle: 'Oração pela Família'
          }
        ]

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setCommunications(mockCommunications)
      } catch (error) {
        console.error('Error fetching communications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunications()
  }, [organizationId, leaderId, refreshTrigger])

  const getFilteredCommunications = () => {
    let filtered = communications

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(comm => comm.type === filter)
    }

    // Filter by date
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(comm => {
          const commDate = new Date(comm.timestamp)
          return commDate.toDateString() === now.toDateString()
        })
        break
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filtered = filtered.filter(comm => comm.timestamp > weekAgo)
        break
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        filtered = filtered.filter(comm => comm.timestamp > monthAgo)
        break
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
            </svg>
          </div>
        )
      case 'call':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
        )
      case 'email':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read': return 'text-green-600'
      case 'delivered': return 'text-blue-600'
      case 'sent': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'read': return 'Lida'
      case 'delivered': return 'Entregue'
      case 'sent': return 'Enviada'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  const filteredCommunications = getFilteredCommunications()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-4">
          {/* Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">Ligações</option>
            <option value="email">Email</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todo o período</option>
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {filteredCommunications.length} comunicação{filteredCommunications.length !== 1 ? 'ões' : ''} encontrada{filteredCommunications.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Communications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse flex items-start space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCommunications.length > 0 ? (
        <div className="space-y-4">
          {filteredCommunications.map((comm) => (
            <div key={comm.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {getTypeIcon(comm.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/dashboard/people/${comm.personId}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {comm.personName}
                      </Link>
                      <span className={`text-sm ${getStatusColor(comm.status)}`}>
                        {getStatusLabel(comm.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{comm.timestamp.toLocaleDateString('pt-BR')}</span>
                      <span>{comm.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {comm.message && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {comm.message}
                    </p>
                  )}

                  {comm.initiativeId && comm.initiativeTitle && (
                    <div className="flex items-center text-xs text-indigo-600">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Relacionado à iniciativa: {comm.initiativeTitle}</span>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma comunicação encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter !== 'all' || dateFilter !== 'all'
              ? 'Tente ajustar os filtros para encontrar mais comunicações.'
              : 'Suas comunicações aparecerão aqui conforme você interage com os liderados.'
            }
          </p>
        </div>
      )}
    </div>
  )
}