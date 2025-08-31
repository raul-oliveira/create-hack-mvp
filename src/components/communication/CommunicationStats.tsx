'use client'

import { useState, useEffect } from 'react'

interface CommunicationStatsProps {
  organizationId: string
  leaderId: string
  refreshTrigger: number
}

interface StatsData {
  totalCommunications: number
  thisWeekCommunications: number
  averagePerDay: number
  mostActiveDay: string
  responseRate: number
}

export function CommunicationStats({ organizationId, leaderId, refreshTrigger }: CommunicationStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalCommunications: 0,
    thisWeekCommunications: 0,
    averagePerDay: 0,
    mostActiveDay: 'Segunda',
    responseRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Mock data for now - in real implementation would fetch from database
        // This would track WhatsApp messages sent, calls made, etc.
        const mockStats: StatsData = {
          totalCommunications: 247,
          thisWeekCommunications: 23,
          averagePerDay: 3.3,
          mostActiveDay: 'Terça-feira',
          responseRate: 72
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats(mockStats)
      } catch (error) {
        console.error('Error fetching communication stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [organizationId, leaderId, refreshTrigger])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map(i => (
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Total Communications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total de Comunicações</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.totalCommunications}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Esta Semana</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.thisWeekCommunications}</dd>
              <dd className="text-xs text-gray-500">Últimos 7 dias</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Average Per Day */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Média Diária</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.averagePerDay}</dd>
              <dd className="text-xs text-gray-500">Comunicações/dia</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Most Active Day */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Dia Mais Ativo</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.mostActiveDay}</dd>
              <dd className="text-xs text-gray-500">Esta semana</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Response Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Resposta</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.responseRate}%</dd>
              <dd className="text-xs text-gray-500">Mensagens respondidas</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}