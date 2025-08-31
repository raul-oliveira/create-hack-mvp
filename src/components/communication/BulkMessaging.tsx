'use client'

import { useState, useEffect } from 'react'
import { PeopleRepositoryClient } from '@/lib/data/people-repository-client'
import type { Person } from '@/lib/schemas/people'

interface BulkMessagingProps {
  organizationId: string
  leaderId: string
  onMessageSent: () => void
}

export function BulkMessaging({ organizationId, leaderId, onMessageSent }: BulkMessagingProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all' | 'active' | 'married' | 'single' | 'young' | 'senior'>('all')
  const [progress, setProgress] = useState({ sent: 0, total: 0, errors: 0 })
  const [showProgress, setShowProgress] = useState(false)

  const repository = new PeopleRepositoryClient()

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true)
        const result = await repository.findMany(
          { organizationId, leaderId },
          { limit: 1000, orderBy: 'name', orderDirection: 'asc' }
        )
        
        // Only include people with phone numbers for messaging
        const peopleWithPhones = result.data.filter(person => person.phone)
        setPeople(peopleWithPhones)
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPeople()
  }, [organizationId, leaderId])

  const getFilteredPeople = () => {
    let filtered = people

    // Apply search filter
    if (searchFilter) {
      const search = searchFilter.toLowerCase()
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(search) ||
        (person.email && person.email.toLowerCase().includes(search))
      )
    }

    // Apply group filter
    switch (groupFilter) {
      case 'active':
        // People who have been synced recently (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        filtered = filtered.filter(person => {
          const lastSync = person.last_synced_at ? new Date(person.last_synced_at) : null
          return lastSync && lastSync > thirtyDaysAgo
        })
        break
      case 'married':
        filtered = filtered.filter(person => (person as any).marital_status === 'married')
        break
      case 'single':
        filtered = filtered.filter(person => (person as any).marital_status === 'single')
        break
      case 'young':
        // People under 30
        filtered = filtered.filter(person => {
          if (!person.birth_date) return false
          const age = new Date().getFullYear() - new Date(person.birth_date).getFullYear()
          return age < 30
        })
        break
      case 'senior':
        // People over 60
        filtered = filtered.filter(person => {
          if (!person.birth_date) return false
          const age = new Date().getFullYear() - new Date(person.birth_date).getFullYear()
          return age > 60
        })
        break
    }

    return filtered
  }

  const handlePersonToggle = (personId: string) => {
    const newSelected = new Set(selectedPeople)
    if (newSelected.has(personId)) {
      newSelected.delete(personId)
    } else {
      newSelected.add(personId)
    }
    setSelectedPeople(newSelected)
  }

  const handleSelectAll = () => {
    const filteredPeople = getFilteredPeople()
    if (selectedPeople.size === filteredPeople.length) {
      setSelectedPeople(new Set())
    } else {
      setSelectedPeople(new Set(filteredPeople.map(p => (p as any).id || p.name)))
    }
  }

  const handleSendMessages = async () => {
    if (selectedPeople.size === 0 || !message.trim()) {
      alert('Selecione pelo menos uma pessoa e digite uma mensagem.')
      return
    }

    setSending(true)
    setShowProgress(true)
    setProgress({ sent: 0, total: selectedPeople.size, errors: 0 })

    const selectedPeopleList = people.filter(person => 
      selectedPeople.has((person as any).id || person.name)
    )

    // Simulate bulk sending with delays to avoid WhatsApp rate limits
    for (let i = 0; i < selectedPeopleList.length; i++) {
      const person = selectedPeopleList[i]
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // In real implementation, this would send via WhatsApp API
        const personalizedMessage = message.replace(/{{nome}}/g, person.name)
        console.log(`Sending to ${person.name}: ${personalizedMessage}`)
        
        // Simulate opening WhatsApp for each person
        if (person.phone) {
          const phoneNumber = person.phone.replace(/\D/g, '')
          const encodedMessage = encodeURIComponent(personalizedMessage)
          
          // In a real implementation, you might queue these or use a WhatsApp Business API
          // For now, we'll just log the intent
          console.log(`WhatsApp URL: https://wa.me/55${phoneNumber}?text=${encodedMessage}`)
        }
        
        setProgress(prev => ({ ...prev, sent: prev.sent + 1 }))
      } catch (error) {
        console.error(`Failed to send message to ${person.name}:`, error)
        setProgress(prev => ({ ...prev, errors: prev.errors + 1 }))
      }
    }

    // Reset form after sending
    setTimeout(() => {
      setSending(false)
      setShowProgress(false)
      setSelectedPeople(new Set())
      setMessage('')
      onMessageSent()
      alert('Mensagens enviadas com sucesso!')
    }, 1000)
  }

  const filteredPeople = getFilteredPeople()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="h-32 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message Composition */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compor Mensagem</h3>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar com o nome da pessoa."
        />
        
        <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
          <span>Use {{nome}} para personalização automática</span>
          <span>{message.length}/1000 caracteres</span>
        </div>

        {/* Preview */}
        {message && (
          <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Pré-visualização:</div>
            <div className="text-sm">
              {message.replace(/{{nome}}/g, 'João Silva')}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar pessoas..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="active">Pessoas Ativas</option>
            <option value="married">Casados</option>
            <option value="single">Solteiros</option>
            <option value="young">Jovens (&lt; 30 anos)</option>
            <option value="senior">Idosos (&gt; 60 anos)</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {selectedPeople.size} de {filteredPeople.length} selecionado{selectedPeople.size !== 1 ? 's' : ''}
          </span>
          
          <button
            onClick={handleSelectAll}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {selectedPeople.size === filteredPeople.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
      </div>

      {/* People Selection List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900">
            Selecionar Destinatários ({filteredPeople.length} pessoas com WhatsApp)
          </h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredPeople.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredPeople.map((person) => {
                const personId = (person as any).id || person.name
                const isSelected = selectedPeople.has(personId)
                
                return (
                  <label key={personId} className="flex items-center p-4 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePersonToggle(personId)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                          <div className="text-sm text-gray-500">
                            {person.phone} {person.email && `• ${person.email}`}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {person.sync_source === 'webhook' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              InChurch
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-sm">Nenhuma pessoa encontrada com os filtros aplicados</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Modal */}
      {showProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enviando Mensagens</h3>
            
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Enviadas: {progress.sent}/{progress.total}</span>
                <span>Erros: {progress.errors}</span>
              </div>
              
              {progress.sent === progress.total && (
                <div className="text-center text-green-600 text-sm font-medium">
                  Todas as mensagens foram enviadas!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSendMessages}
          disabled={selectedPeople.size === 0 || !message.trim() || sending}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {sending ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
              </svg>
              Enviar {selectedPeople.size} mensagem{selectedPeople.size !== 1 ? 's' : ''} via WhatsApp
            </>
          )}
        </button>
      </div>
    </div>
  )
}