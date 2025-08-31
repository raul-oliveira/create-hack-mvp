'use client'

import { useState, useEffect } from 'react'
import { PersonCard } from './PersonCard'
import { SearchAndFilter } from './SearchAndFilter'
import { PeopleRepository } from '@/lib/data/people-repository'
import type { Person } from '@/lib/schemas/people'

interface PeopleListProps {
  organizationId: string
  leaderId: string
}

export function PeopleList({ organizationId, leaderId }: PeopleListProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<string>('')
  const [syncSourceFilter, setSyncSourceFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const repository = new PeopleRepository()

  const fetchPeople = async (resetList = false) => {
    try {
      setLoading(true)
      const currentPage = resetList ? 1 : page

      // Parse sort options
      let orderBy = 'name'
      let orderDirection: 'asc' | 'desc' = 'asc'

      switch (sortBy) {
        case 'name_desc':
          orderBy = 'name'
          orderDirection = 'desc'
          break
        case 'recent_activity':
          orderBy = 'last_synced_at'
          orderDirection = 'desc'
          break
        case 'sync_date':
          orderBy = 'last_synced_at'
          orderDirection = 'desc'
          break
        case 'birth_date':
          orderBy = 'birth_date'
          orderDirection = 'asc'
          break
        default:
          orderBy = 'name'
          orderDirection = 'asc'
      }

      const result = await repository.findMany(
        {
          organizationId,
          leaderId,
          search: search || undefined,
          maritalStatus: maritalStatusFilter || undefined,
          syncSource: syncSourceFilter || undefined
        },
        {
          page: currentPage,
          limit: 20,
          orderBy,
          orderDirection
        }
      )

      if (resetList) {
        setPeople(result.data)
        setPage(1)
      } else {
        setPeople(prev => [...prev, ...result.data])
      }

      setHasMore(result.hasMore)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar liderados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeople(true)
  }, [search, maritalStatusFilter, syncSourceFilter, sortBy])

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    fetchPeople(false)
  }

  const handlePersonUpdate = (updatedPerson: Person) => {
    setPeople(prev => 
      prev.map(person => 
        (person as any).id === (updatedPerson as any).id ? updatedPerson : person
      )
    )
  }

  const handlePersonDelete = (deletedPersonId: string) => {
    setPeople(prev => prev.filter(person => (person as any).id !== deletedPersonId))
    setTotal(prev => prev - 1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setMaritalStatusFilter('')
    setSyncSourceFilter('')
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar liderados</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchPeople(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filters */}
      <SearchAndFilter
        search={search}
        onSearchChange={setSearch}
        maritalStatusFilter={maritalStatusFilter}
        onMaritalStatusChange={setMaritalStatusFilter}
        syncSourceFilter={syncSourceFilter}
        onSyncSourceChange={setSyncSourceFilter}
        totalResults={total}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={handleClearFilters}
      />

      {/* People Content */}
      <div className="p-6">
        {loading && people.length === 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`border rounded-lg p-4 ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}>
                <div className="animate-pulse">
                  {viewMode === 'grid' ? (
                    <>
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded mb-4"></div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-16 bg-gray-300 rounded"></div>
                        <div className="h-8 w-16 bg-gray-300 rounded"></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-16 bg-gray-300 rounded"></div>
                        <div className="h-8 w-16 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum liderado encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || maritalStatusFilter || syncSourceFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando seu primeiro liderado.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 mb-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {people.map(person => (
                <PersonCard
                  key={(person as any).id || person.name}
                  person={person}
                  onUpdate={handlePersonUpdate}
                  onDelete={handlePersonDelete}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
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
  )
}