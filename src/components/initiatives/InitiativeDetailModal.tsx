'use client'

import { useState, useEffect } from 'react'
import { Initiative, InitiativeWithPerson } from '@/lib/schemas/initiatives'
import { MessageEditor } from './MessageEditor'
import { InitiativeActions } from './InitiativeActions'
import { PersonContext } from './PersonContext'

interface InitiativeDetailModalProps {
  initiative: InitiativeWithPerson
  isOpen: boolean
  onClose: () => void
  onUpdate: (initiative: Initiative) => void
  onStatusChange: (initiativeId: string, newStatus: Initiative['status']) => void
}

export function InitiativeDetailModal({
  initiative,
  isOpen,
  onClose,
  onUpdate,
  onStatusChange
}: InitiativeDetailModalProps) {
  const [editedMessage, setEditedMessage] = useState(initiative.suggested_message || '')
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Initialize edited message when initiative changes
  useEffect(() => {
    setEditedMessage(initiative.edited_message || initiative.suggested_message || '')
  }, [initiative.id, initiative.edited_message, initiative.suggested_message])

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editedMessage !== (initiative.edited_message || initiative.suggested_message)) {
        saveDraft()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [editedMessage])

  const saveDraft = async () => {
    // In a real implementation, this would save to the backend
    setIsDraftSaved(true)
    setTimeout(() => setIsDraftSaved(false), 2000)
  }

  const handleSaveMessage = async () => {
    try {
      // Update the initiative with the edited message
      const updatedInitiative = {
        ...initiative,
        edited_message: editedMessage
      }
      
      // Call the update function
      onUpdate(updatedInitiative)
      
      // Mark as draft saved
      setIsDraftSaved(true)
      setTimeout(() => setIsDraftSaved(false), 2000)
      
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleRegenerateMessage = async () => {
    // In a real implementation, this would call the LLM to regenerate
    // For now, we'll just add a timestamp to show it's "regenerated"
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    setEditedMessage(`${initiative.suggested_message}\n\n[Regenerada às ${timestamp}]`)
  }

  const handleWhatsAppSend = () => {
    if (!initiative.person?.phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    // Clean phone number and prepare WhatsApp URL
    const phoneNumber = initiative.person.phone.replace(/\D/g, '')
    const message = encodeURIComponent(editedMessage)
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${message}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
    
    // Update initiative status and track WhatsApp click
    onStatusChange(initiative.id!, 'in_progress')
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-50'
    if (priority >= 6) return 'text-orange-600 bg-orange-50'
    if (priority >= 4) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100'
      case 'in_progress':
        return 'text-blue-700 bg-blue-100'
      case 'completed':
        return 'text-green-700 bg-green-100'
      case 'cancelled':
        return 'text-gray-700 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-lg">
                  {initiative.person?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {initiative.title}
                </h2>
                <p className="text-sm text-gray-600">
                  {initiative.person?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Priority Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(initiative.priority)}`}>
                Prioridade {initiative.priority}
              </span>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(initiative.status)}`}>
                {initiative.status === 'pending' && 'Pendente'}
                {initiative.status === 'in_progress' && 'Em Andamento'}
                {initiative.status === 'completed' && 'Concluída'}
                {initiative.status === 'cancelled' && 'Cancelada'}
              </span>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col lg:flex-row max-h-[calc(90vh-140px)]">
            {/* Left Panel - Context */}
            <div className="w-full lg:w-1/3 p-6 border-r border-gray-200 overflow-y-auto">
              <PersonContext 
                person={initiative.person}
                change={initiative.change}
                initiative={initiative}
              />
            </div>

            {/* Right Panel - Message Editor */}
            <div className="w-full lg:w-2/3 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Message Type Indicator */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {initiative.type === 'message' && (
                      <>
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span className="text-sm font-medium text-green-700">Mensagem WhatsApp</span>
                      </>
                    )}
                    {initiative.type === 'call' && (
                      <>
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        <span className="text-sm font-medium text-blue-700">Ligação</span>
                      </>
                    )}
                    {initiative.type === 'visit' && (
                      <>
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-sm font-medium text-purple-700">Visita</span>
                      </>
                    )}
                  </div>
                  {isDraftSaved && (
                    <span className="text-xs text-green-600 ml-auto">
                      ✓ Rascunho salvo
                    </span>
                  )}
                </div>

                {/* Message Editor Component */}
                <MessageEditor
                  message={editedMessage}
                  onChange={setEditedMessage}
                  onSave={handleSaveMessage}
                  onRegenerate={handleRegenerateMessage}
                  isPreviewMode={isPreviewMode}
                  onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
                  personName={initiative.person?.name || 'Pessoa'}
                />

                {/* Action Buttons */}
                <InitiativeActions
                  initiative={initiative}
                  editedMessage={editedMessage}
                  onWhatsAppSend={handleWhatsAppSend}
                  onStatusChange={onStatusChange}
                  onSave={handleSaveMessage}
                />

                {/* Initiative Metadata */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Informações da Iniciativa</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Criada em:</span>
                      <span>{formatDate(initiative.created_at!)}</span>
                    </div>
                    {initiative.due_date && (
                      <div className="flex justify-between">
                        <span>Prazo:</span>
                        <span className={
                          new Date(initiative.due_date) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-900'
                        }>
                          {formatDate(initiative.due_date)}
                        </span>
                      </div>
                    )}
                    {initiative.completed_at && (
                      <div className="flex justify-between">
                        <span>Concluída em:</span>
                        <span>{formatDate(initiative.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}