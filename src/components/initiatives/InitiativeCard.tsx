'use client'

import { InitiativeWithPerson, InitiativeStatus } from '@/lib/schemas/initiatives'

interface InitiativeCardProps {
  initiative: InitiativeWithPerson
  onStatusChange: (initiativeId: string, newStatus: InitiativeStatus) => void
  onWhatsAppSend: (initiativeId: string) => void
  onOpenDetail: () => void
}

export function InitiativeCard({
  initiative,
  onStatusChange,
  onWhatsAppSend,
  onOpenDetail
}: InitiativeCardProps) {
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 border-red-200'
    if (priority >= 6) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (priority >= 4) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status: InitiativeStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: InitiativeStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluída'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
          </svg>
        )
      case 'call':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        )
      case 'visit':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        )
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'message':
        return 'Mensagem'
      case 'call':
        return 'Ligação'
      case 'visit':
        return 'Visita'
      default:
        return type
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return null
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = () => {
    if (!initiative.due_date) return false
    return new Date(initiative.due_date) < new Date() && initiative.status !== 'completed'
  }

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (initiative.type === 'message' && initiative.person?.phone) {
      // Prepare WhatsApp URL
      const phoneNumber = initiative.person.phone.replace(/\D/g, '')
      const message = encodeURIComponent(
        initiative.edited_message || initiative.suggested_message || 'Olá!'
      )
      const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${message}`
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
      onWhatsAppSend(initiative.id!)
    } else if (initiative.type === 'call' && initiative.person?.phone) {
      // Make a phone call
      const phoneNumber = initiative.person.phone.replace(/\D/g, '')
      window.open(`tel:+55${phoneNumber}`, '_self')
      onStatusChange(initiative.id!, 'in_progress')
    } else {
      // For visit or when no phone available, just mark as in progress
      onStatusChange(initiative.id!, 'in_progress')
    }
  }

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusChange(initiative.id!, 'completed')
  }

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isOverdue() ? 'bg-red-50 border-l-4 border-l-red-400' : ''
      }`}
      onClick={onOpenDetail}
    >
      <div className="flex items-start justify-between">
        {/* Initiative Info */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-2">
            {/* Type Icon */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
              initiative.type === 'message' ? 'bg-green-100 text-green-800' :
              initiative.type === 'call' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {getTypeIcon(initiative.type)}
              <span>{getTypeLabel(initiative.type)}</span>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(initiative.status)}`}>
              {getStatusLabel(initiative.status)}
            </span>

            {/* Priority Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${getPriorityColor(initiative.priority)}`}>
              Prioridade {initiative.priority}
            </span>

            {/* Overdue Warning */}
            {isOverdue() && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-900">
                ⚠️ Atrasada
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-base font-medium text-gray-900 mb-2 line-clamp-1">
            {initiative.title}
          </h4>

          {/* Description Preview */}
          {initiative.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {initiative.description}
            </p>
          )}

          {/* Message Preview */}
          {initiative.suggested_message && (
            <div className="bg-gray-100 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Mensagem sugerida:</p>
              <p className="text-sm text-gray-900 line-clamp-2">
                {initiative.edited_message || initiative.suggested_message}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Criada: {formatDate(initiative.created_at!)}</span>
            {initiative.due_date && (
              <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
                Prazo: {formatDate(initiative.due_date)}
              </span>
            )}
            {initiative.completed_at && (
              <span className="text-green-600">
                Concluída: {formatDate(initiative.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {initiative.status !== 'completed' && (
            <>
              {/* Quick Action Button */}
              <button
                onClick={handleQuickAction}
                disabled={!initiative.person?.phone && (initiative.type === 'message' || initiative.type === 'call')}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  initiative.type === 'message' 
                    ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300'
                    : initiative.type === 'call'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:cursor-not-allowed`}
                title={
                  !initiative.person?.phone && (initiative.type === 'message' || initiative.type === 'call')
                    ? 'Telefone não disponível'
                    : initiative.type === 'message' 
                    ? 'Enviar no WhatsApp'
                    : initiative.type === 'call'
                    ? 'Ligar'
                    : 'Marcar como em andamento'
                }
              >
                {getTypeIcon(initiative.type)}
                <span className="ml-1">
                  {initiative.type === 'message' ? 'WhatsApp' :
                   initiative.type === 'call' ? 'Ligar' : 'Agendar'}
                </span>
              </button>

              {/* Quick Complete Button */}
              <button
                onClick={handleQuickComplete}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                title="Marcar como concluída"
              >
                ✓
              </button>
            </>
          )}

          {/* View Details Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetail()
            }}
            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-200 transition-colors"
            title="Ver detalhes"
          >
            Detalhes
          </button>
        </div>
      </div>
    </div>
  )
}