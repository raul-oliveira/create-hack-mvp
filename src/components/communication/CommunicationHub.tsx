'use client'

import { useState, useEffect } from 'react'
import { CommunicationStats } from './CommunicationStats'
import { CommunicationHistory } from './CommunicationHistory'
import { BulkMessaging } from './BulkMessaging'
import { MessageTemplates } from './MessageTemplates'
import { QuickActions } from './QuickActions'

interface CommunicationHubProps {
  organizationId: string
  leaderId: string
}

export function CommunicationHub({ organizationId, leaderId }: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'bulk' | 'templates' | 'quick'>('history')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const tabs = [
    {
      id: 'history' as const,
      name: 'Histórico',
      description: 'Visualizar comunicações recentes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'bulk' as const,
      name: 'Mensagens em Lote',
      description: 'Enviar para múltiplas pessoas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'templates' as const,
      name: 'Modelos',
      description: 'Gerenciar templates de mensagens',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'quick' as const,
      name: 'Ações Rápidas',
      description: 'Comunicações frequentes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ]

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Communication Stats */}
      <CommunicationStats 
        organizationId={organizationId}
        leaderId={leaderId}
        refreshTrigger={refreshTrigger}
      />

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className={`
                  ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                  -ml-0.5 mr-2
                `}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'history' && (
            <CommunicationHistory
              organizationId={organizationId}
              leaderId={leaderId}
              refreshTrigger={refreshTrigger}
            />
          )}
          
          {activeTab === 'bulk' && (
            <BulkMessaging
              organizationId={organizationId}
              leaderId={leaderId}
              onMessageSent={handleRefresh}
            />
          )}
          
          {activeTab === 'templates' && (
            <MessageTemplates
              organizationId={organizationId}
              leaderId={leaderId}
            />
          )}
          
          {activeTab === 'quick' && (
            <QuickActions
              organizationId={organizationId}
              leaderId={leaderId}
              onActionExecuted={handleRefresh}
            />
          )}
        </div>
      </div>
    </div>
  )
}