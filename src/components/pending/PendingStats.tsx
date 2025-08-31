import { createClient } from '@/lib/supabase/server'
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface PendingStatsProps {
  leaderId: string
}

export async function PendingStats({ leaderId }: PendingStatsProps) {
  const supabase = await createClient()

  // Get pending initiatives stats
  const { data: initiatives, error } = await supabase
    .from('initiatives')
    .select('status, urgency_score, created_at')
    .eq('leader_id', leaderId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending stats:', error)
    return null
  }

  const totalPending = initiatives?.length || 0
  const urgentCount = initiatives?.filter(init => init.urgency_score >= 8).length || 0
  const overdueCount = initiatives?.filter(init => {
    const createdAt = new Date(init.created_at)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    return createdAt < threeDaysAgo
  }).length || 0

  // Get this week completed for comparison
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  
  const { data: completedThisWeek } = await supabase
    .from('initiatives')
    .select('id')
    .eq('leader_id', leaderId)
    .eq('status', 'completed')
    .gte('updated_at', weekStart.toISOString())

  const completedCount = completedThisWeek?.length || 0

  const stats = [
    {
      name: 'Total Pendente',
      value: totalPending,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Iniciativas aguardando ação'
    },
    {
      name: 'Urgentes',
      value: urgentCount,
      icon: FireIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Precisam de atenção imediata'
    },
    {
      name: 'Atrasadas',
      value: overdueCount,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Mais de 3 dias pendentes'
    },
    {
      name: 'Concluídas (7 dias)',
      value: completedCount,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Finalizadas esta semana'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 truncate">
                  {stat.name}
                </p>
              </div>
              <div className="flex items-baseline">
                <p className={`text-2xl font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}