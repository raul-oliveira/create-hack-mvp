'use client'

import { InitiativeWithPerson, PeopleChange } from '@/lib/schemas/initiatives'
import { Person } from '@/lib/schemas/people'

interface PersonContextProps {
  person?: Person
  change?: PeopleChange
  initiative: InitiativeWithPerson
}

export function PersonContext({ person, change, initiative }: PersonContextProps) {
  const formatPhone = (phone: string | null) => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const number = cleaned.substring(2)
      return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`
    }
    return phone
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getMaritalStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      'single': 'Solteiro(a)',
      'married': 'Casado(a)',
      'divorced': 'Divorciado(a)',
      'widowed': 'Viúvo(a)',
      'separated': 'Separado(a)',
      'engaged': 'Noivo(a)'
    }
    return status ? labels[status] || status : 'Não informado'
  }

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'life_event': 'Evento da Vida',
      'engagement': 'Engajamento',
      'personal_data': 'Dados Pessoais',
      'relationship': 'Relacionamento',
      'special_date': 'Data Especial'
    }
    return labels[type] || type
  }

  const personData = person || initiative.person

  return (
    <div className="space-y-6">
      {/* Person Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Informações da Pessoa
        </h3>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {personData?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-indigo-900">{personData?.name}</h4>
              {personData?.birth_date && (
                <p className="text-sm text-indigo-700">
                  {formatDate(personData.birth_date)}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {personData?.email && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{personData.email}</span>
              </div>
            )}
            
            {personData?.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{formatPhone(personData.phone)}</span>
              </div>
            )}
            
            {(personData as any)?.marital_status && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{getMaritalStatusLabel((personData as any).marital_status)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Information */}
      {change && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Mudança Detectada
          </h3>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">
                {getChangeTypeLabel(change.change_type)}
              </span>
              <span className="text-xs text-orange-600">
                {change.detected_at ? formatDate(change.detected_at) : ''}
              </span>
            </div>
            
            {change.old_value && change.new_value && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">De:</span>
                  <div className="bg-white p-2 rounded border text-gray-900 font-mono text-xs mt-1">
                    {typeof change.old_value === 'string' ? change.old_value : JSON.stringify(change.old_value)}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Para:</span>
                  <div className="bg-white p-2 rounded border text-gray-900 font-mono text-xs mt-1">
                    {typeof change.new_value === 'string' ? change.new_value : JSON.stringify(change.new_value)}
                  </div>
                </div>
              </div>
            )}
            
            {change.urgency_score && (
              <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                <span className="text-sm text-orange-700">Pontuação de Urgência:</span>
                <span className="font-semibold text-orange-800">
                  {change.urgency_score}/10
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {change?.ai_analysis && typeof change.ai_analysis === 'object' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Análise da IA
          </h3>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            {(change.ai_analysis as any).llmAnalysis?.contextualAnalysis && (
              <div>
                <h4 className="text-sm font-medium text-purple-800 mb-2">Análise Contextual</h4>
                <p className="text-sm text-purple-700">
                  {(change.ai_analysis as any).llmAnalysis.contextualAnalysis}
                </p>
              </div>
            )}
            
            {(change.ai_analysis as any).llmAnalysis?.pastoralNotes && (
              <div className="pt-2 border-t border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Notas Pastorais</h4>
                <p className="text-sm text-purple-700">
                  {(change.ai_analysis as any).llmAnalysis.pastoralNotes}
                </p>
              </div>
            )}
            
            {(change.ai_analysis as any).llmAnalysis?.overallUrgency && (
              <div className="pt-2 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Urgência (IA):</span>
                  <span className="font-semibold text-purple-800">
                    {(change.ai_analysis as any).llmAnalysis.overallUrgency}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initiative Description */}
      {initiative.description && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v4H7V5zm2 6H7v2h2v-2zm2-6h2v4h-2V5zm2 6h-2v2h2v-2z" clipRule="evenodd" />
            </svg>
            Descrição da Iniciativa
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {initiative.description}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {personData?.phone && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Ações Rápidas
          </h3>
          
          <div className="space-y-2">
            <button className="w-full p-3 text-left bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.479 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.130-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <div>
                  <div className="font-medium text-green-800">Chamar no WhatsApp</div>
                  <div className="text-sm text-green-600">{formatPhone(personData.phone)}</div>
                </div>
              </div>
            </button>
            
            <button className="w-full p-3 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <div>
                  <div className="font-medium text-blue-800">Ligar</div>
                  <div className="text-sm text-blue-600">{formatPhone(personData.phone)}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}