'use client'

import { useState } from 'react'
import { Person } from '@/lib/schemas/people'
import { CreateInitiativeModal } from './CreateInitiativeModal'

interface ProfileStats {
  totalInitiatives: number
  completedInitiatives: number
  pendingInitiatives: number
  lastInteraction: any
  completionRate: number
}

interface ProfileHeaderProps {
  person: Person
  age: number | null
  stats: ProfileStats
  leaderId: string
  organizationId: string
}

export function ProfileHeader({ person, age, stats, leaderId, organizationId }: ProfileHeaderProps) {
  const [showCreateInitiative, setShowCreateInitiative] = useState(false)

  const formatPhone = (phone: string | null) => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const number = cleaned.substring(2)
      return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`
    }
    return phone
  }

  const getMaritalStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)',
      'separated': 'Separado(a)',
      'engaged': 'Noivo(a)'
    }
    return status ? labels[status] || status : 'Não informado'
  }

  const getSyncSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'manual': 'Manual',
      'webhook': 'InChurch (Webhook)',
      'daily_polling': 'InChurch (Sync)'
    }
    return labels[source] || source
  }

  const getSyncSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'manual': 'bg-blue-100 text-blue-800',
      'webhook': 'bg-green-100 text-green-800',
      'daily_polling': 'bg-green-100 text-green-800'
    }
    return colors[source] || 'bg-gray-100 text-gray-800'
  }

  const handleQuickAction = (action: 'whatsapp' | 'call') => {
    if (!person.phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = person.phone.replace(/\D/g, '')
    
    if (action === 'whatsapp') {
      const whatsappUrl = `https://wa.me/55${phoneNumber}`
      window.open(whatsappUrl, '_blank')
    } else if (action === 'call') {
      window.open(`tel:+55${phoneNumber}`, '_self')
    }
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        {/* Profile Content */}
        <div className="px-6 pb-6">
          <div className="sm:flex sm:items-end sm:space-x-5">
            {/* Profile Picture */}
            <div className="flex">
              <div className="relative -mt-16">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-indigo-600">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Status indicator */}
                <div className="absolute bottom-2 right-2">
                  <div className={`w-6 h-6 rounded-full border-2 border-white ${
                    person.sync_source === 'webhook' ? 'bg-green-400' : 
                    person.sync_source === 'daily_polling' ? 'bg-blue-400' : 
                    'bg-gray-400'
                  }`} title={getSyncSourceLabel(person.sync_source)}></div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
              <div className="sm:hidden 2xl:block mt-6 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {person.name}
                </h1>
                <div className="mt-2 flex items-center space-x-3 text-sm text-gray-500">
                  {age && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {age} anos
                    </span>
                  )}
                  {person.marital_status && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {getMaritalStatusLabel(person.marital_status)}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSyncSourceColor(person.sync_source)}`}>
                    {getSyncSourceLabel(person.sync_source)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {/* Quick Actions */}
                <div className="flex space-x-3">
                  {person.phone && (
                    <>
                      <button
                        onClick={() => handleQuickAction('whatsapp')}
                        className="bg-green-600 flex-1 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                        </svg>
                        WhatsApp
                      </button>
                      
                      <button
                        onClick={() => handleQuickAction('call')}
                        className="bg-blue-600 flex-1 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        Ligar
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowCreateInitiative(true)}
                    className="bg-indigo-600 flex-1 text-white px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nova Iniciativa
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {person.email && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{person.email}</p>
                  </div>
                </div>
              </div>
            )}

            {person.phone && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-sm font-medium text-gray-900">{formatPhone(person.phone)}</p>
                  </div>
                </div>
              </div>
            )}

            {person.birth_date && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Nascimento</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(person.birth_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {person.last_synced_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Última Atualização</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(person.last_synced_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalInitiatives}</p>
                <p className="text-xs text-blue-900">Total Iniciativas</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completedInitiatives}</p>
                <p className="text-xs text-green-900">Concluídas</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingInitiatives}</p>
                <p className="text-xs text-yellow-900">Pendentes</p>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                <p className="text-xs text-purple-900">Taxa Conclusão</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Initiative Modal */}
      {showCreateInitiative && (
        <CreateInitiativeModal
          person={person}
          leaderId={leaderId}
          organizationId={organizationId}
          isOpen={showCreateInitiative}
          onClose={() => setShowCreateInitiative(false)}
          onSuccess={() => {
            setShowCreateInitiative(false)
            // Optionally refresh the page or update state
            window.location.reload()
          }}
        />
      )}
    </>
  )
}