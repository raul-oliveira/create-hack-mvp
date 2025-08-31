'use client'

import { useState } from 'react'
import { Person } from '@/lib/schemas/people'
import { InitiativeRepository } from '@/lib/data/initiative-repository'

interface CreateInitiativeModalProps {
  person: Person
  leaderId: string
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateInitiativeModal({ 
  person, 
  leaderId, 
  organizationId, 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateInitiativeModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    whatsapp_message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const repository = new InitiativeRepository()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type.trim() || !formData.description.trim()) {
      setError('Tipo e descrição são obrigatórios')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const initiativeData = {
        title: formData.type.trim(),
        type: formData.type.includes('WhatsApp') || formData.type.includes('Mensagem') ? 'message' as const : 
              formData.type.includes('Ligar') || formData.type.includes('Telefonema') ? 'call' as const :
              'visit' as const,
        description: formData.description.trim(),
        priority: formData.priority === 'high' ? 3 : formData.priority === 'medium' ? 2 : 1,
        status: 'pending' as const,
        person_id: (person as any).id || person.name,
        leader_id: leaderId,
        organization_id: organizationId,
        due_date: formData.due_date ? new Date(formData.due_date) : null,
        whatsapp_message: formData.whatsapp_message.trim() || null
      }

      await repository.create(initiativeData)
      onSuccess()
    } catch (err) {
      console.error('Error creating initiative:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar iniciativa')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppPreview = () => {
    if (!formData.whatsapp_message.trim()) return

    if (!person.phone) {
      alert('Número de telefone não disponível para esta pessoa.')
      return
    }

    const phoneNumber = person.phone.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(formData.whatsapp_message.trim())
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const initiativeTypes = [
    'Visita Pastoral',
    'Telefonema de Cuidado',
    'Oração Específica',
    'Acompanhamento Espiritual',
    'Apoio em Crise',
    'Celebração/Parabenização',
    'Convite para Atividade',
    'Aconselhamento',
    'Intercessão',
    'Outro'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Nova Iniciativa</h3>
            <p className="text-sm text-gray-500 mt-1">Criar nova iniciativa para {person.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          {/* Initiative Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Iniciativa *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Selecione um tipo</option>
              {initiativeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Descreva o objetivo e contexto desta iniciativa..."
              required
            />
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Limite
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* WhatsApp Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Mensagem WhatsApp (opcional)
              </label>
              {formData.whatsapp_message && person.phone && (
                <button
                  type="button"
                  onClick={handleWhatsAppPreview}
                  className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/>
                  </svg>
                  Testar Mensagem
                </button>
              )}
            </div>
            <textarea
              value={formData.whatsapp_message}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_message: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Digite a mensagem que será enviada via WhatsApp..."
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.whatsapp_message.length}/1000 caracteres
            </div>
          </div>

          {/* Person Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Informações do Liderado</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">Nome:</span> {person.name}</div>
              {person.phone && (
                <div><span className="font-medium">Telefone:</span> {person.phone}</div>
              )}
              {person.email && (
                <div><span className="font-medium">Email:</span> {person.email}</div>
              )}
              {person.marital_status && (
                <div><span className="font-medium">Estado Civil:</span> {person.marital_status}</div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.type.trim() || !formData.description.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Iniciativa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}