'use client'

import { useState, useEffect } from 'react'
import { PeopleRepositoryClient } from '@/lib/data/people-repository-client'

interface PeopleStatsProps {
  organizationId: string
  leaderId: string
}

interface StatsData {
  totalPeople: number
  activePeople: number
  recentlyAdded: number
  inchurchSynced: number
  manualEntries: number
}

export function PeopleStats({ organizationId, leaderId }: PeopleStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalPeople: 0,
    activePeople: 0,
    recentlyAdded: 0,
    inchurchSynced: 0,
    manualEntries: 0
  })
  const [loading, setLoading] = useState(true)

  const repository = new PeopleRepositoryClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Get all people for this leader
        const allPeople = await repository.findMany(
          { organizationId, leaderId },
          { limit: 1000, orderBy: 'name', orderDirection: 'asc' }
        )

        // Calculate statistics
        const totalPeople = allPeople.total
        const people = allPeople.data

        // People who have been active (had recent sync or interactions)
        const activePeople = people.filter(person => {
          const lastSync = person.last_synced_at ? new Date(person.last_synced_at) : null
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return lastSync && lastSync > thirtyDaysAgo
        }).length

        // Recently added (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentlyAdded = people.filter(person => {
          const createdAt = person.created_at ? new Date(person.created_at) : null
          return createdAt && createdAt > weekAgo
        }).length

        // Sync source breakdown
        const inchurchSynced = people.filter(person => 
          person.sync_source === 'webhook' || person.sync_source === 'daily_polling'
        ).length
        
        const manualEntries = people.filter(person => 
          person.sync_source === 'manual'
        ).length

        setStats({
          totalPeople,
          activePeople,
          recentlyAdded,
          inchurchSynced,
          manualEntries
        })
      } catch (error) {
        console.error('Error fetching people stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [organizationId, leaderId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {/* Total People */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total de Pessoas</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.totalPeople}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Active People */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Pessoas Ativas</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.activePeople}</dd>
              <dd className="text-xs text-gray-500">Últimos 30 dias</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Recently Added */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Adicionadas Recentemente</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.recentlyAdded}</dd>
              <dd className="text-xs text-gray-500">Últimos 7 dias</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* InChurch Synced */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">InChurch Sync</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.inchurchSynced}</dd>
              <dd className="text-xs text-gray-500">Sincronizados</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Manual Entries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Entrada Manual</dt>
              <dd className="text-lg font-medium text-gray-900">{stats.manualEntries}</dd>
              <dd className="text-xs text-gray-500">Criados manualmente</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}