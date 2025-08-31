import { createClient } from '@/lib/supabase/server'
import { PendingInitiativeCard } from './PendingInitiativeCard'
import { 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface PendingInitiativesProps {
  leaderId: string
  organizationId: string
}

export async function PendingInitiatives({ leaderId, organizationId }: PendingInitiativesProps) {
  const supabase = await createClient()

  // Get pending initiatives with person details
  const { data: initiatives, error } = await supabase
    .from('initiatives')
    .select(`
      id,
      type,
      message,
      urgency_score,
      status,
      created_at,
      updated_at,
      people (
        id,
        name,
        phone,
        email,
        status as person_status
      )
    `)
    .eq('leader_id', leaderId)
    .eq('status', 'pending')
    .order('urgency_score', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending initiatives:', error)
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Erro ao carregar pendências</p>
      </div>
    )
  }

  if (!initiatives || initiatives.length === 0) {
    return (
      <div className="p-12 text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma pendência encontrada
        </h3>
        <p className="text-gray-500">
          Ótimo trabalho! Todas as suas iniciativas estão em dia.
        </p>
      </div>
    )
  }

  // Group by urgency
  const urgent = initiatives.filter(init => init.urgency_score >= 8)
  const important = initiatives.filter(init => init.urgency_score >= 6 && init.urgency_score < 8)
  const normal = initiatives.filter(init => init.urgency_score < 6)

  return (
    <div className="divide-y divide-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Iniciativas Pendentes
          </h3>
          <span className="text-sm text-gray-500">
            {initiatives.length} {initiatives.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Urgent Section */}
        {urgent.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Urgentes ({urgent.length})
              </h4>
            </div>
            <div className="space-y-4">
              {urgent.map((initiative) => (
                <PendingInitiativeCard 
                  key={initiative.id} 
                  initiative={initiative}
                  priority="urgent"
                />
              ))}
            </div>
          </div>
        )}

        {/* Important Section */}
        {important.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Importantes ({important.length})
              </h4>
            </div>
            <div className="space-y-4">
              {important.map((initiative) => (
                <PendingInitiativeCard 
                  key={initiative.id} 
                  initiative={initiative}
                  priority="important"
                />
              ))}
            </div>
          </div>
        )}

        {/* Normal Section */}
        {normal.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Normais ({normal.length})
              </h4>
            </div>
            <div className="space-y-4">
              {normal.map((initiative) => (
                <PendingInitiativeCard 
                  key={initiative.id} 
                  initiative={initiative}
                  priority="normal"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}