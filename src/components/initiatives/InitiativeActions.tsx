'use client'

import { useState } from 'react'
import { InitiativeWithPerson, InitiativeStatus } from '@/lib/schemas/initiatives'

interface InitiativeActionsProps {
  initiative: InitiativeWithPerson
  editedMessage: string
  onWhatsAppSend: () => void
  onStatusChange: (initiativeId: string, newStatus: InitiativeStatus) => void
  onSave: () => void
}

export function InitiativeActions({
  initiative,
  editedMessage,
  onWhatsAppSend,
  onStatusChange,
  onSave
}: InitiativeActionsProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = (newStatus: InitiativeStatus) => {
    onStatusChange(initiative.id!, newStatus)
    setIsStatusMenuOpen(false)
  }

  const getStatusIcon = (status: InitiativeStatus) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'cancelled':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
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

  const getStatusColor = (status: InitiativeStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 hover:bg-yellow-50'
      case 'in_progress':
        return 'text-blue-700 hover:bg-blue-50'
      case 'completed':
        return 'text-green-700 hover:bg-green-50'
      case 'cancelled':
        return 'text-gray-700 hover:bg-gray-50'
      default:
        return 'text-gray-700 hover:bg-gray-50'
    }
  }

  const isMessageChanged = editedMessage !== (initiative.edited_message || initiative.suggested_message)

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* WhatsApp Send Button */}
        {initiative.type === 'message' && (
          <button
            onClick={onWhatsAppSend}
            disabled={!initiative.person?.phone}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span>Enviar WhatsApp</span>
          </button>
        )}

        {/* Call Button */}
        {initiative.type === 'call' && (
          <button
            onClick={() => {
              if (initiative.person?.phone) {
                const phoneNumber = initiative.person.phone.replace(/\D/g, '')
                window.open(`tel:+55${phoneNumber}`, '_self')
                onStatusChange(initiative.id!, 'in_progress')
              }
            }}
            disabled={!initiative.person?.phone}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <span>Ligar</span>
          </button>
        )}

        {/* Visit Button */}
        {initiative.type === 'visit' && (
          <button
            onClick={() => {
              onStatusChange(initiative.id!, 'in_progress')
            }}
            className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>Marcar Visita</span>
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isMessageChanged || isSaving}
          className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSaving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Salvar</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Change Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(initiative.status)}
              <span className="font-medium">
                {getStatusLabel(initiative.status)}
              </span>
            </div>
            <svg className={`w-5 h-5 transition-transform ${isStatusMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Status Menu */}
          {isStatusMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsStatusMenuOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      status === initiative.status ? 'bg-gray-50' : ''
                    } ${getStatusColor(status)}`}
                  >
                    {getStatusIcon(status)}
                    <span>{getStatusLabel(status)}</span>
                    {status === initiative.status && (
                      <svg className="w-4 h-4 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Complete Button */}
        {initiative.status !== 'completed' && (
          <button
            onClick={() => handleStatusChange('completed')}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Concluir</span>
          </button>
        )}
      </div>

      {/* Warning Messages */}
      {!initiative.person?.phone && (initiative.type === 'message' || initiative.type === 'call') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-orange-800">
              <strong>Número de telefone não disponível.</strong> Você pode atualizar o contato da pessoa antes de enviar a mensagem.
            </div>
          </div>
        </div>
      )}

      {/* Success Message for Completed */}
      {initiative.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-green-800">
              <strong>Iniciativa concluída!</strong> Esta ação pastoral foi executada com sucesso.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}