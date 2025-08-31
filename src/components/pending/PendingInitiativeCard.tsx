'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChatBubbleLeftIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'

interface Initiative {
  id: string
  type: string
  message: string
  urgency_score: number
  status: string
  created_at: string
  updated_at: string
  people: {
    id: string
    name: string
    phone: string | null
    email: string | null
    status: string
  } | null
}

interface PendingInitiativeCardProps {
  initiative: Initiative
  priority: 'urgent' | 'important' | 'normal'
}

export function PendingInitiativeCard({ initiative, priority }: PendingInitiativeCardProps) {
  const [isExecuting, setIsExecuting] = useState(false)

  if (!initiative.people) {
    return null
  }

  const priorityConfig = {
    urgent: {
      borderColor: 'border-l-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    important: {
      borderColor: 'border-l-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    normal: {
      borderColor: 'border-l-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    }
  }

  const config = priorityConfig[priority]
  const createdAt = new Date(initiative.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR })

  const getInitiativeIcon = (type: string) => {
    switch (type) {
      case 'mensagem':
        return ChatBubbleLeftIcon
      case 'ligacao':
        return PhoneIcon
      case 'visita':
        return UserIcon
      default:
        return ChatBubbleLeftIcon
    }
  }

  const Icon = getInitiativeIcon(initiative.type)

  const handleExecuteInitiative = () => {
    setIsExecuting(true)
    
    if (initiative.type === 'mensagem' && initiative.people?.phone) {
      // WhatsApp deep link
      const message = encodeURIComponent(initiative.message)
      const whatsappUrl = `https://wa.me/55${initiative.people.phone.replace(/\D/g, '')}?text=${message}`
      window.open(whatsappUrl, '_blank')
    } else if (initiative.type === 'ligacao' && initiative.people?.phone) {
      // Phone call
      window.location.href = `tel:${initiative.people.phone}`
    }
    
    // TODO: Update initiative status to 'in_progress'
    setTimeout(() => setIsExecuting(false), 2000)
  }

  const handleMarkComplete = () => {
    // TODO: Update initiative status to 'completed'
    console.log('Marking as complete:', initiative.id)
  }

  return (
    <div className={`bg-white border-l-4 ${config.borderColor} rounded-r-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`flex-shrink-0 p-2 ${config.bgColor} rounded-lg`}>
              <Icon className={`h-5 w-5 ${config.textColor}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Link 
                  href={`/dashboard/people/${initiative.people.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {initiative.people.name}
                </Link>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${config.bgColor} ${config.textColor} font-medium`}>
                  {initiative.type}
                </span>
                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  Score: {initiative.urgency_score}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {initiative.message}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {timeAgo}
                </div>
                {initiative.people.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1" />
                    {initiative.people.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleExecuteInitiative}
              disabled={isExecuting || !initiative.people?.phone}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayCircleIcon className="h-3 w-3 mr-1" />
              {isExecuting ? 'Executando...' : 'Executar'}
            </button>
            
            <button
              onClick={handleMarkComplete}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}