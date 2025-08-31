'use client'

import { InitiativeStatus } from '@/lib/schemas/initiatives'

interface InitiativeFiltersProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  statusFilter: InitiativeStatus | ''
  onStatusFilterChange: (status: InitiativeStatus | '') => void
  priorityFilter: 'high' | 'medium' | 'low' | ''
  onPriorityFilterChange: (priority: 'high' | 'medium' | 'low' | '') => void
  totalCount: number
}

export function InitiativeFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  totalCount
}: InitiativeFiltersProps) {
  
  const clearAllFilters = () => {
    onSearchChange('')
    onStatusFilterChange('')
    onPriorityFilterChange('')
  }

  const hasActiveFilters = searchTerm || statusFilter || priorityFilter

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por pessoa, título da iniciativa ou descrição..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as InitiativeStatus | '')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-0">
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as 'high' | 'medium' | 'low' | '')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todas as prioridades</option>
              <option value="high">Alta (8-10)</option>
              <option value="medium">Média (6-7)</option>
              <option value="low">Baixa (1-5)</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center text-sm text-gray-500">
          <span>
            {totalCount} iniciativa{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-indigo-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {statusFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {
                statusFilter === 'pending' ? 'Pendentes' :
                statusFilter === 'in_progress' ? 'Em Andamento' :
                statusFilter === 'completed' ? 'Concluídas' :
                'Canceladas'
              }
              <button
                onClick={() => onStatusFilterChange('')}
                className="ml-1 hover:text-blue-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {priorityFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Prioridade: {
                priorityFilter === 'high' ? 'Alta' :
                priorityFilter === 'medium' ? 'Média' :
                'Baixa'
              }
              <button
                onClick={() => onPriorityFilterChange('')}
                className="ml-1 hover:text-orange-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}