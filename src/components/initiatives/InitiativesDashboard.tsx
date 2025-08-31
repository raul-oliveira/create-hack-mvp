'use client'

import { useState, useEffect } from 'react'
import { InitiativeCard } from './InitiativeCard'
import { InitiativeFilters } from './InitiativeFilters'
import { InitiativeDetailModal } from './InitiativeDetailModal'
import { InitiativeRepositoryClient } from '@/lib/data/initiative-repository-client'
import { InitiativeWithPerson, InitiativeFilters as IFilters, InitiativeStatus } from '@/lib/schemas/initiatives'

interface InitiativesDashboardProps {
  leaderId: string
  organizationId: string
}

export function InitiativesDashboard({ leaderId, organizationId }: InitiativesDashboardProps) {
  const [initiatives, setInitiatives] = useState<InitiativeWithPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInitiative, setSelectedInitiative] = useState<InitiativeWithPerson | null>(null)
  
  // Filters
  const [filters, setFilters] = useState<IFilters>({
    leader_id: leaderId
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<InitiativeStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | ''>('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const repository = new InitiativeRepositoryClient()

  const fetchInitiatives = async (resetList = false) => {
    try {
      setLoading(true)
      const currentPage = resetList ? 1 : page

      // Build filters
      const queryFilters: IFilters = {
        leader_id: leaderId,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      }

      // Add priority filter
      if (priorityFilter === 'high') {
        queryFilters.priority_min = 8
      } else if (priorityFilter === 'medium') {
        queryFilters.priority_min = 6
        queryFilters.priority_max = 7
      } else if (priorityFilter === 'low') {
        queryFilters.priority_max = 5
      }

      const result = await repository.findMany(
        queryFilters,
        {
          page: currentPage,
          limit: 20,
          orderBy: 'priority',
          orderDirection: 'desc'
        }
      )

      if (resetList) {
        setInitiatives(result.data)
        setPage(1)
      } else {
        setInitiatives(prev => [...prev, ...result.data])
      }

      setHasMore(result.hasMore)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar iniciativas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitiatives(true)
  }, [leaderId, searchTerm, statusFilter, priorityFilter])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    fetchInitiatives(false)
  }

  const handleInitiativeUpdate = (updatedInitiative: Partial<InitiativeWithPerson>) => {
    setInitiatives(prev => 
      prev.map(initiative => 
        initiative.id === updatedInitiative.id 
          ? { ...initiative, ...updatedInitiative }
          : initiative
      )
    )
    
    // Update selected initiative if it's the one being updated
    if (selectedInitiative?.id === updatedInitiative.id) {
      setSelectedInitiative(prev => prev ? { ...prev, ...updatedInitiative } : null)
    }
  }

  const handleStatusChange = async (initiativeId: string, newStatus: InitiativeStatus) => {
    try {
      const updatedInitiative = await repository.update(initiativeId, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date() : undefined,
        whatsapp_clicked_at: newStatus === 'in_progress' ? new Date() : undefined
      })
      
      handleInitiativeUpdate(updatedInitiative)
    } catch (error) {
      console.error('Error updating initiative status:', error)
    }
  }

  const handleWhatsAppSend = (initiativeId: string) => {
    // Mark as in progress when WhatsApp is clicked
    handleStatusChange(initiativeId, 'in_progress')
  }

  const groupInitiativesByPerson = (initiatives: InitiativeWithPerson[]) => {
    const grouped = new Map<string, InitiativeWithPerson[]>()
    
    for (const initiative of initiatives) {
      const personId = initiative.person_id
      if (!grouped.has(personId)) {
        grouped.set(personId, [])
      }
      grouped.get(personId)!.push(initiative)
    }
    
    return Array.from(grouped.entries()).map(([personId, personInitiatives]) => ({
      personId,
      personName: personInitiatives[0].person?.name || 'Nome não disponível',
      initiatives: personInitiatives.sort((a, b) => b.priority - a.priority)
    }))
  }

  const groupedInitiatives = groupInitiativesByPerson(initiatives)

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar iniciativas</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchInitiatives(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <>
      <div>
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <InitiativeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            totalCount={total}
          />
        </div>

        {/* Initiatives List */}
        <div className="p-6">
          {loading && initiatives.length === 0 ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-20 bg-gray-300 rounded"></div>
                        <div className="h-8 w-20 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : groupedInitiatives.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma iniciativa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || priorityFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'As iniciativas aparecerão aqui quando forem geradas pelo sistema.'}
              </p>
            </div>
          ) : (
            <>
              {/* Grouped Initiatives */}
              <div className="space-y-8">
                {groupedInitiatives.map(({ personId, personName, initiatives: personInitiatives }) => (
                  <div key={personId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Person Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {personName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{personName}</h3>
                            <p className="text-sm text-gray-500">
                              {personInitiatives.length} iniciativa{personInitiatives.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        {/* Highest Priority Badge */}
                        <div className="flex items-center space-x-2">
                          {personInitiatives.some(i => i.priority >= 8) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Alta Prioridade
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Person's Initiatives */}
                    <div className="divide-y divide-gray-200">
                      {personInitiatives.map((initiative) => (
                        <InitiativeCard
                          key={initiative.id}
                          initiative={initiative}
                          onStatusChange={handleStatusChange}
                          onWhatsAppSend={handleWhatsAppSend}
                          onOpenDetail={() => setSelectedInitiative(initiative)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    {loading ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInitiative && (
        <InitiativeDetailModal
          initiative={selectedInitiative}
          isOpen={!!selectedInitiative}
          onClose={() => setSelectedInitiative(null)}
          onUpdate={(updated) => {
            handleInitiativeUpdate(updated)
            setSelectedInitiative(null)
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  )
}