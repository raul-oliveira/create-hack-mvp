'use client'

import { useState, useEffect } from 'react'
import { InitiativeRepositoryClient } from '@/lib/data/initiative-repository-client'
import { InitiativeStats } from '@/lib/schemas/initiatives'

interface InitiativesStatsProps {
  leaderId: string
}

export function InitiativesStats({ leaderId }: InitiativesStatsProps) {
  const [stats, setStats] = useState<InitiativeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repository = new InitiativeRepositoryClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const result = await repository.getStatsForLeader(leaderId)
        setStats(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [leaderId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-800">
            {error || 'Erro ao carregar estatísticas'}
          </span>
        </div>
      </div>
    )
  }

  const statItems = [
    {
      name: 'Pendentes',
      value: stats.total_pending,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Iniciativas aguardando execução'
    },
    {
      name: 'Em Andamento',
      value: stats.total_in_progress,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100',
      description: 'Iniciativas sendo executadas'
    },
    {
      name: 'Concluídas',
      value: stats.total_completed,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-100',
      description: 'Iniciativas finalizadas'
    },
    {
      name: 'Taxa de Conclusão',
      value: `${stats.completion_rate}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: stats.completion_rate >= 70 ? 'text-green-600 bg-green-100' : 
             stats.completion_rate >= 40 ? 'text-yellow-600 bg-yellow-100' : 
             'text-red-600 bg-red-100',
      description: 'Percentual de iniciativas concluídas'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${item.color}`}>
              {item.icon}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {item.description}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {index === 0 && stats.overdue_count > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center text-xs text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {stats.overdue_count} atrasada{stats.overdue_count > 1 ? 's' : ''}
              </div>
            </div>
          )}

          {index === 0 && stats.high_priority_count > 0 && (
            <div className="mt-2">
              <div className="flex items-center text-xs text-orange-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                {stats.high_priority_count} alta prioridade
              </div>
            </div>
          )}

          {index === 3 && stats.avg_completion_time_days !== null && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                Tempo médio: {stats.avg_completion_time_days} dia{stats.avg_completion_time_days > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}