'use client'

import { useState, useEffect } from 'react'
import { Person } from '@/lib/schemas/people'
import { InitiativeWithPerson } from '@/lib/schemas/initiatives'
import { InitiativeRepository } from '@/lib/data/initiative-repository'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTabs } from './ProfileTabs'
import { ProfileOverview } from './ProfileOverview'
import { ProfileTimeline } from './ProfileTimeline'
import { ProfileNotes } from './ProfileNotes'
import { ProfileInitiatives } from './ProfileInitiatives'

interface LideradoProfileProps {
  person: Person
  leaderId: string
  organizationId: string
}

export function LideradoProfile({ person, leaderId, organizationId }: LideradoProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'initiatives' | 'notes'>('overview')
  const [initiatives, setInitiatives] = useState<InitiativeWithPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const repository = new InitiativeRepository()

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        setLoading(true)
        
        // Fetch initiatives for this person
        const initiativeResult = await repository.findMany(
          { person_id: (person as any).id || person.name },
          { limit: 100, orderBy: 'created_at', orderDirection: 'desc' }
        )
        
        setInitiatives(initiativeResult.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching person data:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchPersonData()
  }, [(person as any).id, person.name])

  const handleInitiativeUpdate = (updatedInitiative: InitiativeWithPerson) => {
    setInitiatives(prev => 
      prev.map(initiative => 
        initiative.id === updatedInitiative.id ? updatedInitiative : initiative
      )
    )
  }

  const calculateAge = () => {
    if (!person.birth_date) return null
    const birth = new Date(person.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getStats = () => {
    const totalInitiatives = initiatives.length
    const completedInitiatives = initiatives.filter(i => i.status === 'completed').length
    const pendingInitiatives = initiatives.filter(i => i.status === 'pending').length
    const lastInteraction = initiatives.length > 0 
      ? initiatives.reduce((latest, current) => 
          new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest
        )
      : null

    return {
      totalInitiatives,
      completedInitiatives,
      pendingInitiatives,
      lastInteraction,
      completionRate: totalInitiatives > 0 ? Math.round((completedInitiatives / totalInitiatives) * 100) : 0
    }
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader 
        person={person}
        age={calculateAge()}
        stats={getStats()}
        leaderId={leaderId}
        organizationId={organizationId}
      />

      {/* Navigation Tabs */}
      <ProfileTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={getStats()}
      />

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <ProfileOverview 
                person={person}
                initiatives={initiatives}
                stats={getStats()}
              />
            )}
            
            {activeTab === 'timeline' && (
              <ProfileTimeline 
                person={person}
                initiatives={initiatives}
                onInitiativeUpdate={handleInitiativeUpdate}
              />
            )}
            
            {activeTab === 'initiatives' && (
              <ProfileInitiatives 
                person={person}
                initiatives={initiatives}
                onInitiativeUpdate={handleInitiativeUpdate}
                leaderId={leaderId}
              />
            )}
            
            {activeTab === 'notes' && (
              <ProfileNotes 
                person={person}
                leaderId={leaderId}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}