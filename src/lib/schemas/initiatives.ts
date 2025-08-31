import { z } from 'zod'

// Initiative types
export const InitiativeTypeSchema = z.enum([
  'message',    // WhatsApp/SMS message
  'call',       // Phone call
  'visit'       // In-person visit
])

// Initiative status
export const InitiativeStatusSchema = z.enum([
  'pending',     // Not yet executed
  'in_progress', // Leader is working on it
  'completed',   // Executed successfully
  'cancelled'    // Cancelled by leader
])

// Change types that trigger initiatives
export const ChangeTypeSchema = z.enum([
  'life_event',     // Birth, death, marriage, etc.
  'engagement',     // Church attendance changes
  'personal_data',  // Contact info, address, etc.
  'relationship',   // Marital status changes
  'special_date'    // Birthday, anniversary, etc.
])

// Core initiative schema
export const InitiativeSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  leader_id: z.string().uuid(),
  person_id: z.string().uuid(),
  change_id: z.string().uuid().nullable().optional(),
  
  // Initiative details
  type: InitiativeTypeSchema,
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().nullable().optional(),
  suggested_message: z.string().nullable().optional(),
  edited_message: z.string().nullable().optional(),
  
  // Status and priority
  status: InitiativeStatusSchema.default('pending'),
  priority: z.number().int().min(1).max(10).default(5),
  
  // Dates
  due_date: z.date().nullable().optional(),
  completed_at: z.date().nullable().optional(),
  whatsapp_clicked_at: z.date().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
})

// People changes schema for tracking data changes
export const PeopleChangeSchema = z.object({
  id: z.string().uuid().optional(),
  person_id: z.string().uuid(),
  change_type: ChangeTypeSchema,
  old_value: z.unknown().nullable().optional(),
  new_value: z.unknown().nullable().optional(),
  detected_at: z.date().optional(),
  processed_at: z.date().nullable().optional(),
  urgency_score: z.number().int().min(1).max(10).nullable().optional(),
  ai_analysis: z.record(z.unknown()).nullable().optional()
})

// Initiative feedback schema
export const InitiativeFeedbackSchema = z.object({
  id: z.string().uuid().optional(),
  initiative_id: z.string().uuid(),
  leader_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  effectiveness: z.enum(['very_helpful', 'helpful', 'neutral', 'not_helpful', 'counterproductive']).optional(),
  feedback_text: z.string().max(1000).optional(),
  execution_notes: z.string().max(1000).optional(),
  created_at: z.date().optional()
})

// Request/Response schemas

// Create initiative request
export const CreateInitiativeSchema = InitiativeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
})

// Update initiative request
export const UpdateInitiativeSchema = InitiativeSchema.partial().omit({
  id: true,
  organization_id: true,
  leader_id: true,
  person_id: true,
  created_at: true
})

// Initiative list filters
export const InitiativeFiltersSchema = z.object({
  leader_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
  status: InitiativeStatusSchema.optional(),
  type: InitiativeTypeSchema.optional(),
  priority_min: z.number().int().min(1).max(10).optional(),
  priority_max: z.number().int().min(1).max(10).optional(),
  due_before: z.date().optional(),
  due_after: z.date().optional(),
  search: z.string().optional()
})

// Initiative with related data
export const InitiativeWithPersonSchema = InitiativeSchema.extend({
  person: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    birth_date: z.date().nullable()
  }).optional(),
  change: PeopleChangeSchema.optional()
})

// Dashboard statistics
export const InitiativeStatsSchema = z.object({
  total_pending: z.number().int().nonnegative(),
  total_in_progress: z.number().int().nonnegative(),
  total_completed: z.number().int().nonnegative(),
  overdue_count: z.number().int().nonnegative(),
  high_priority_count: z.number().int().nonnegative(),
  completion_rate: z.number().min(0).max(100),
  avg_completion_time_days: z.number().nonnegative().nullable()
})

// Export types
export type Initiative = z.infer<typeof InitiativeSchema>
export type PeopleChange = z.infer<typeof PeopleChangeSchema>
export type InitiativeFeedback = z.infer<typeof InitiativeFeedbackSchema>
export type CreateInitiative = z.infer<typeof CreateInitiativeSchema>
export type UpdateInitiative = z.infer<typeof UpdateInitiativeSchema>
export type InitiativeFilters = z.infer<typeof InitiativeFiltersSchema>
export type InitiativeWithPerson = z.infer<typeof InitiativeWithPersonSchema>
export type InitiativeStats = z.infer<typeof InitiativeStatsSchema>
export type InitiativeType = z.infer<typeof InitiativeTypeSchema>
export type InitiativeStatus = z.infer<typeof InitiativeStatusSchema>
export type ChangeType = z.infer<typeof ChangeTypeSchema>

// Validation helpers
export const validateInitiative = (data: unknown) => {
  return InitiativeSchema.safeParse(data)
}

export const validateCreateInitiative = (data: unknown) => {
  return CreateInitiativeSchema.safeParse(data)
}

export const validateUpdateInitiative = (data: unknown) => {
  return UpdateInitiativeSchema.safeParse(data)
}

export const validatePeopleChange = (data: unknown) => {
  return PeopleChangeSchema.safeParse(data)
}

export const validateInitiativeFeedback = (data: unknown) => {
  return InitiativeFeedbackSchema.safeParse(data)
}

// Utility functions
export const getInitiativeTypeLabel = (type: InitiativeType): string => {
  const labels: Record<InitiativeType, string> = {
    'message': 'Mensagem',
    'call': 'Ligação',
    'visit': 'Visita'
  }
  return labels[type]
}

export const getInitiativeStatusLabel = (status: InitiativeStatus): string => {
  const labels: Record<InitiativeStatus, string> = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluída',
    'cancelled': 'Cancelada'
  }
  return labels[status]
}

export const getChangeTypeLabel = (changeType: ChangeType): string => {
  const labels: Record<ChangeType, string> = {
    'life_event': 'Evento da Vida',
    'engagement': 'Engajamento',
    'personal_data': 'Dados Pessoais',
    'relationship': 'Relacionamento',
    'special_date': 'Data Especial'
  }
  return labels[changeType]
}

export const getPriorityLabel = (priority: number): string => {
  if (priority >= 8) return 'Alta'
  if (priority >= 6) return 'Média'
  if (priority >= 4) return 'Normal'
  return 'Baixa'
}

export const getPriorityColor = (priority: number): string => {
  if (priority >= 8) return 'text-red-600'
  if (priority >= 6) return 'text-yellow-600'
  if (priority >= 4) return 'text-blue-600'
  return 'text-gray-600'
}

export const isOverdue = (dueDate: Date | null): boolean => {
  if (!dueDate) return false
  return dueDate < new Date()
}

export const calculateDaysUntilDue = (dueDate: Date | null): number | null => {
  if (!dueDate) return null
  const diffTime = dueDate.getTime() - new Date().getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}