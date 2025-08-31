'use client'

import { useState } from 'react'
import { Person } from '@/lib/schemas/people'
import { InitiativeWithPerson } from '@/lib/schemas/initiatives'

interface ProfileTimelineProps {
  person: Person
  initiatives: InitiativeWithPerson[]
  onInitiativeUpdate: (initiative: InitiativeWithPerson) => void
}

export function ProfileTimeline({ person, initiatives, onInitiativeUpdate }: ProfileTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')

  const getTimelineEvents = () => {
    const events = initiatives
      .filter(initiative => {
        if (filter === 'all') return true
        return initiative.status === filter
      })
      .map(initiative => ({
        id: initiative.id,
        type: 'initiative',
        title: initiative.type,
        description: initiative.description,
        status: initiative.status,
        priority: initiative.priority,
        date: new Date(initiative.created_at!),
        dueDate: initiative.due_date ? new Date(initiative.due_date) : null,
        whatsappMessage: initiative.whatsapp_message,
        data: initiative
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return events
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
      'high': 'text-red-600 bg-red-50',
      'medium': 'text-orange-600 bg-orange-50',
      'low': 'text-blue-600 bg-blue-50'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50'
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      'high': 'Alta',
      'medium': 'Média',
      'low': 'Baixa'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 ring-8 ring-white">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'cancelled':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 ring-8 ring-white">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'in_progress':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 ring-8 ring-white">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
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

  const timelineEvents = getTimelineEvents()

  return (
    <div className="p-6">
      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'Todas', count: initiatives.length },
            { id: 'pending', label: 'Pendentes', count: initiatives.filter(i => i.status === 'pending').length },
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
      </div>

      {/* Timeline */}
      {timelineEvents.length > 0 ? (
        <div className="flow-root">
          <ul className="-mb-8">
            {timelineEvents.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== timelineEvents.length - 1 && (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="relative flex space-x-3">
                    <div>{getEventIcon(event.status)}</div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                            {getStatusLabel(event.status)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                            {getPriorityLabel(event.priority)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        
                        {event.whatsappMessage && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                                  </svg>
                                  <span className="text-xs font-medium text-green-800">Mensagem WhatsApp</span>
                                </div>
                                <p className="text-sm text-green-700 whitespace-pre-wrap">{event.whatsappMessage}</p>
                              </div>
                              <button
                                onClick={() => handleWhatsAppClick(event.whatsappMessage!, person.phone)}
                                className="ml-3 flex-shrink-0 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                                disabled={!person.phone}
                              >
                                Enviar
                              </button>
                            </div>
                          </div>
                        )}

                        {event.dueDate && (
                          <div className="mt-2 flex items-center text-xs">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={`${
                              event.dueDate < new Date() && event.status !== 'completed'
                                ? 'text-red-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              {event.dueDate < new Date() && event.status !== 'completed' ? 'Vencida em: ' : 'Vence em: '}
                              {event.dueDate.toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        <time dateTime={event.date.toISOString()}>
                          {event.date.toLocaleDateString('pt-BR')}
                        </time>
                        <div className="text-xs mt-1">
                          {event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Não há atividades registradas para este liderado ainda.'
              : `Não há atividades com status "${getStatusLabel(filter)}" para este liderado.`
            }
          </p>
        </div>
      )}
    </div>
  )
}