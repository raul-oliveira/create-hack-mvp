'use client'

import { useState, useEffect } from 'react'
import { PeopleRepositoryClient } from '@/lib/data/people-repository-client'
import { InitiativeRepositoryClient } from '@/lib/data/initiative-repository-client'
import type { Person } from '@/lib/schemas/people'
import type { Initiative } from '@/lib/schemas/initiatives'

interface QuickActionsProps {
  organizationId: string
  leaderId: string
  onActionExecuted: () => void
}

interface QuickActionData {
  birthdays: Person[]
  pendingFollowUps: Person[]
  inactivePeople: Person[]
  newMembers: Person[]
  upcomingInitiatives: Initiative[]
}

export function QuickActions({ organizationId, leaderId, onActionExecuted }: QuickActionsProps) {
  const [data, setData] = useState<QuickActionData>({
    birthdays: [],
    pendingFollowUps: [],
    inactivePeople: [],
    newMembers: [],
    upcomingInitiatives: []
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const peopleRepository = new PeopleRepositoryClient()
  const initiativeRepository = new InitiativeRepositoryClient()

  useEffect(() => {
    const fetchQuickActionData = async () => {
      try {
        setLoading(true)
        
        // Get all people
        const peopleResult = await peopleRepository.findMany(
          { organizationId, leaderId },
          { limit: 1000, orderBy: 'name', orderDirection: 'asc' }
        )

        // Get initiatives
        const initiativesResult = await initiativeRepository.findMany(
          { organizationId, leaderId },
          { limit: 100, orderBy: 'created_at', orderDirection: 'desc' }
        )

        const people = peopleResult.data
        const initiatives = initiativesResult.data

        // Process data for quick actions
        const today = new Date()
        const thisWeek = new Date()
        thisWeek.setDate(thisWeek.getDate() + 7)
        
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // People with birthdays this week
        const birthdays = people.filter(person => {
          if (!person.birth_date) return false
          const birthDate = new Date(person.birth_date)
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
          const nextWeekBirthday = new Date(thisWeek.getFullYear(), birthDate.getMonth(), birthDate.getDate())
          
          return (thisYearBirthday >= today && thisYearBirthday <= thisWeek) ||
                 (nextWeekBirthday >= today && nextWeekBirthday <= thisWeek)
        })

        // People needing follow-up (no recent communication)
        const pendingFollowUps = people.filter(person => {
          const lastSync = person.last_synced_at ? new Date(person.last_synced_at) : null
          return !lastSync || lastSync < thirtyDaysAgo
        }).slice(0, 10) // Limit to 10 for quick actions

        // Inactive people (no sync in last 30 days)
        const inactivePeople = people.filter(person => {
          const lastSync = person.last_synced_at ? new Date(person.last_synced_at) : null
          return !lastSync || lastSync < thirtyDaysAgo
        }).slice(0, 5)

        // New members (synced in last 7 days)
        const newMembers = people.filter(person => {
          const lastSync = person.last_synced_at ? new Date(person.last_synced_at) : null
          return lastSync && lastSync > sevenDaysAgo
        })

        // Upcoming initiatives (due this week)
        const upcomingInitiatives = initiatives.filter(initiative => {
          if (!initiative.scheduled_for) return false
          const scheduledDate = new Date(initiative.scheduled_for)
          return scheduledDate >= today && scheduledDate <= thisWeek && initiative.status === 'pending'
        })

        setData({
          birthdays,
          pendingFollowUps,
          inactivePeople,
          newMembers,
          upcomingInitiatives
        })
      } catch (error) {
        console.error('Error fetching quick action data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuickActionData()
  }, [organizationId, leaderId])

  const handleQuickAction = async (actionType: string, people: Person[], template: string) => {
    setActionLoading(actionType)
    
    try {
      // Simulate bulk messaging with personalized messages
      for (const person of people) {
        if (!person.phone) continue
        
        const personalizedMessage = template.replace(/{{nome}}/g, person.name)
        const phoneNumber = person.phone.replace(/\D/g, '')
        
        // In real implementation, would send via WhatsApp API
        console.log(`Quick Action - ${actionType} to ${person.name}: ${personalizedMessage}`)
        console.log(`WhatsApp URL: https://wa.me/55${phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`)
        
        // Simulate delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      onActionExecuted()
    } catch (error) {
      console.error(`Error executing ${actionType}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const quickActionCards = [
    {
      id: 'birthdays',
      title: 'Aniversários da Semana',
      description: `${data.birthdays.length} pessoa${data.birthdays.length !== 1 ? 's' : ''} fazendo aniversário`,
      icon: (
        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zM3 10h18" />
        </svg>
      ),
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      buttonColor: 'bg-pink-600 hover:bg-pink-700',
      people: data.birthdays,
      template: 'Parabéns pelo seu aniversário, {{nome}}! 🎉 Que Deus abençoe muito sua vida neste novo ano! Desejamos muitas alegrias e bênçãos! 🙏✨',
      disabled: data.birthdays.length === 0
    },
    {
      id: 'follow-ups',
      title: 'Acompanhamento Pendente',
      description: `${data.pendingFollowUps.length} pessoa${data.pendingFollowUps.length !== 1 ? 's' : ''} para acompanhar`,
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      people: data.pendingFollowUps,
      template: 'Olá {{nome}}! Como você está? 😊 Gostaria de saber como tem sido sua semana e se você precisa de alguma oração especial. Estamos aqui para você! 🙏',
      disabled: data.pendingFollowUps.length === 0
    },
    {
      id: 'inactive',
      title: 'Reativar Membros',
      description: `${data.inactivePeople.length} pessoa${data.inactivePeople.length !== 1 ? 's' : ''} inativa${data.inactivePeople.length !== 1 ? 's' : ''}`,
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      people: data.inactivePeople,
      template: 'Olá {{nome}}! Sentimos sua falta! 💛 Como você está? Gostaríamos de saber como podemos apoiá-lo(a) e orar por você. Você é importante para nós! 🙏',
      disabled: data.inactivePeople.length === 0
    },
    {
      id: 'new-members',
      title: 'Boas-vindas',
      description: `${data.newMembers.length} novo${data.newMembers.length !== 1 ? 's' : ''} membro${data.newMembers.length !== 1 ? 's' : ''}`,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      people: data.newMembers,
      template: 'Bem-vindo(a) à nossa igreja, {{nome}}! 🎉 Ficamos muito felizes em tê-lo(a) conosco! Se precisar de alguma coisa ou tiver dúvidas, não hesite em nos procurar! 🙏💛',
      disabled: data.newMembers.length === 0
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
        <span className="text-sm text-gray-500">
          {data.upcomingInitiatives.length} iniciativa{data.upcomingInitiatives.length !== 1 ? 's' : ''} programada{data.upcomingInitiatives.length !== 1 ? 's' : ''} para esta semana
        </span>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActionCards.map((card) => (
          <div
            key={card.id}
            className={`${card.bgColor} ${card.borderColor} border rounded-lg p-6 transition-all duration-200 ${
              card.disabled ? 'opacity-50' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>

            {card.people.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Pessoas:</div>
                <div className="flex flex-wrap gap-1">
                  {card.people.slice(0, 5).map((person, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 text-gray-800"
                    >
                      {person.name}
                    </span>
                  ))}
                  {card.people.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 text-gray-800">
                      +{card.people.length - 5} mais
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => handleQuickAction(card.id, card.people, card.template)}
                disabled={card.disabled || actionLoading === card.id}
                className={`w-full ${card.buttonColor} text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
              >
                {actionLoading === card.id ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                    Enviar Mensagens
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Initiatives */}
      {data.upcomingInitiatives.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Iniciativas Programadas</h3>
          <div className="space-y-3">
            {data.upcomingInitiatives.map((initiative) => (
              <div key={initiative.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    initiative.priority >= 3 ? 'bg-red-500' :
                    initiative.priority === 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{initiative.title}</div>
                    <div className="text-xs text-gray-500">
                      {initiative.scheduled_for && new Date(initiative.scheduled_for).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  {initiative.type === 'message' ? 'Mensagem' :
                   initiative.type === 'call' ? 'Ligação' : 'Visita'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}