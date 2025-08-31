import { InitiativeRepository } from '@/lib/data/initiative-repository'
import { PeopleRepository } from '@/lib/data/people-repository'
import { LLMClient, LLMAnalysisResponse } from '@/lib/ai/llm-client'
import { 
  CreateInitiative, 
  Initiative,
  InitiativeType, 
  PeopleChange 
} from '@/lib/schemas/initiatives'
import { Person } from '@/lib/schemas/people'

export interface GenerationOptions {
  maxInitiativesPerPerson?: number
  organizationId?: string
  leaderId?: string
  batchSize?: number
  skipDuplicates?: boolean
}

export interface GenerationResult {
  initiativesGenerated: number
  changesProcessed: number
  results: Array<{
    personId: string
    changeId: string
    initiativeId?: string
    error?: string
  }>
  processingTime: number
  errors: string[]
}

export interface MessageTemplate {
  type: InitiativeType
  urgencyLevel: 'low' | 'medium' | 'high'
  template: string
  variables: string[]
}

export class InitiativeGenerationService {
  private initiativeRepo = new InitiativeRepository()
  private peopleRepo = new PeopleRepository()
  private llmClient = new LLMClient()

  // Main generation method
  async generateFromProcessedChanges(
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now()
    const { 
      maxInitiativesPerPerson = 3,
      batchSize = 50,
      skipDuplicates = true
    } = options

    const results: GenerationResult['results'] = []
    const errors: string[] = []

    try {
      // Get processed changes with LLM analysis
      const processedChanges = await this.getProcessedChangesWithAnalysis(batchSize)
      
      if (processedChanges.length === 0) {
        return {
          initiativesGenerated: 0,
          changesProcessed: 0,
          results: [],
          processingTime: Date.now() - startTime,
          errors: []
        }
      }

      // Group changes by person
      const changesByPerson = this.groupChangesByPerson(processedChanges)

      // Generate initiatives for each person
      for (const [personId, personChanges] of changesByPerson.entries()) {
        try {
          const personResults = await this.generateInitiativesForPerson(
            personId,
            personChanges,
            {
              maxInitiatives: maxInitiativesPerPerson,
              skipDuplicates,
              organizationId: options.organizationId
            }
          )

          results.push(...personResults.results)
          errors.push(...personResults.errors)

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error generating initiatives for person ${personId}: ${message}`)
          
          // Add error results for each change
          for (const change of personChanges) {
            results.push({
              personId,
              changeId: change.id!,
              error: message
            })
          }
        }
      }

      return {
        initiativesGenerated: results.filter(r => r.initiativeId).length,
        changesProcessed: processedChanges.length,
        results,
        processingTime: Date.now() - startTime,
        errors
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Generation service error: ${message}`)
      
      return {
        initiativesGenerated: 0,
        changesProcessed: 0,
        results,
        processingTime: Date.now() - startTime,
        errors
      }
    }
  }

  // Generate initiatives for a single person
  async generateInitiativesForPerson(
    personId: string,
    changes: Array<PeopleChange & { llmAnalysis?: LLMAnalysisResponse }>,
    options: {
      maxInitiatives?: number
      skipDuplicates?: boolean
      organizationId?: string
    } = {}
  ): Promise<{
    results: Array<{ personId: string; changeId: string; initiativeId?: string; error?: string }>
    errors: string[]
  }> {
    const results: Array<{ personId: string; changeId: string; initiativeId?: string; error?: string }> = []
    const errors: string[] = []
    const { maxInitiatives = 3, skipDuplicates = true } = options

    try {
      // Get person details
      const person = await this.peopleRepo.findById(personId)
      if (!person) {
        throw new Error(`Person not found: ${personId}`)
      }

      // Skip if no leader assigned
      if (!person.leader_id) {
        errors.push(`Person ${personId} has no assigned leader`)
        return { results, errors }
      }

      // Check for existing recent initiatives if skipDuplicates is true
      let existingInitiatives: Initiative[] = []
      if (skipDuplicates) {
        existingInitiatives = await this.getRecentInitiatives(personId, 7) // Last 7 days
      }

      // Sort changes by urgency and LLM analysis
      const sortedChanges = this.prioritizeChanges(changes)
      const initiativesToCreate: CreateInitiative[] = []

      // Process changes up to maxInitiatives
      let generatedCount = 0
      for (const change of sortedChanges) {
        if (generatedCount >= maxInitiatives) break

        try {
          // Skip if similar initiative exists recently
          if (skipDuplicates && this.hasRecentSimilarInitiative(change, existingInitiatives)) {
            results.push({
              personId,
              changeId: change.id!,
              error: 'Similar initiative exists recently'
            })
            continue
          }

          // Generate initiative
          const initiative = await this.createInitiativeFromChange(person, change)
          if (initiative) {
            initiativesToCreate.push(initiative)
            generatedCount++
          }

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error processing change ${change.id}: ${message}`)
          results.push({
            personId,
            changeId: change.id!,
            error: message
          })
        }
      }

      // Bulk create initiatives
      for (const initiativeData of initiativesToCreate) {
        try {
          const createdInitiative = await this.initiativeRepo.create(initiativeData)
          
          // Find corresponding change
          const changeId = changes.find(c => 
            c.id === initiativeData.change_id
          )?.id

          results.push({
            personId,
            changeId: changeId!,
            initiativeId: createdInitiative.id
          })

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error creating initiative: ${message}`)
          results.push({
            personId,
            changeId: initiativeData.change_id!,
            error: message
          })
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Person processing error: ${message}`)
    }

    return { results, errors }
  }

  // Create initiative from change and LLM analysis
  private async createInitiativeFromChange(
    person: Person,
    change: PeopleChange & { llmAnalysis?: LLMAnalysisResponse }
  ): Promise<CreateInitiative | null> {
    const urgencyScore = change.urgency_score || 5
    const llmAnalysis = change.llmAnalysis

    // Determine initiative type based on LLM recommendation or urgency
    const initiativeType = this.determineInitiativeType(urgencyScore, llmAnalysis)
    
    // Generate title and description
    const title = this.generateInitiativeTitle(person, change, initiativeType)
    const description = this.generateInitiativeDescription(person, change, llmAnalysis)
    
    // Generate suggested message
    const suggestedMessage = await this.generateSuggestedMessage(person, change, initiativeType, llmAnalysis)
    
    // Calculate due date based on urgency
    const dueDate = this.calculateDueDate(urgencyScore, llmAnalysis?.suggestedTiming)
    
    // Determine priority (1-10 scale)
    const priority = Math.max(1, Math.min(10, urgencyScore))

    return {
      organization_id: person.organization_id,
      leader_id: person.leader_id!,
      person_id: person.id!,
      change_id: change.id!,
      type: initiativeType,
      title,
      description,
      suggested_message: suggestedMessage,
      priority,
      due_date: dueDate
    }
  }

  // Determine best initiative type
  private determineInitiativeType(
    urgencyScore: number,
    llmAnalysis?: LLMAnalysisResponse
  ): InitiativeType {
    // Use LLM recommendation if available and confident
    if (llmAnalysis?.recommendedActions && llmAnalysis.recommendedActions.length > 0) {
      const topRecommendation = llmAnalysis.recommendedActions
        .sort((a, b) => b.confidence - a.confidence)[0]
      
      if (topRecommendation.confidence >= 0.7) {
        return topRecommendation.type
      }
    }

    // Fallback to urgency-based decision
    if (urgencyScore >= 8) return 'call' // High urgency - direct contact
    if (urgencyScore >= 6) return 'message' // Medium urgency - message first
    return 'message' // Lower urgency - gentle message
  }

  // Generate initiative title
  private generateInitiativeTitle(
    person: Person,
    change: PeopleChange,
    type: InitiativeType
  ): string {
    const actionLabels: Record<InitiativeType, string> = {
      'message': 'Enviar mensagem para',
      'call': 'Ligar para',
      'visit': 'Visitar'
    }

    const changeTypeLabels: Record<string, string> = {
      'life_event': 'evento importante',
      'engagement': 'mudança de engajamento',
      'personal_data': 'atualização de dados',
      'relationship': 'mudança de relacionamento',
      'special_date': 'data especial'
    }

    const changeLabel = changeTypeLabels[change.change_type] || 'mudança'
    return `${actionLabels[type]} ${person.name} - ${changeLabel}`
  }

  // Generate initiative description
  private generateInitiativeDescription(
    person: Person,
    change: PeopleChange,
    llmAnalysis?: LLMAnalysisResponse
  ): string {
    let description = `Mudança detectada em ${person.name}:\n`
    
    if (change.old_value && change.new_value) {
      description += `• De: ${JSON.stringify(change.old_value)}\n`
      description += `• Para: ${JSON.stringify(change.new_value)}\n`
    }
    
    description += `• Tipo: ${change.change_type}\n`
    description += `• Detectado em: ${new Date(change.detected_at).toLocaleDateString('pt-BR')}\n`
    
    if (llmAnalysis?.contextualAnalysis) {
      description += `\n📋 Análise:\n${llmAnalysis.contextualAnalysis}`
    }
    
    if (llmAnalysis?.pastoralNotes) {
      description += `\n🙏 Notas Pastorais:\n${llmAnalysis.pastoralNotes}`
    }
    
    return description.trim()
  }

  // Generate suggested message using templates and LLM enhancement
  private async generateSuggestedMessage(
    person: Person,
    change: PeopleChange,
    type: InitiativeType,
    llmAnalysis?: LLMAnalysisResponse
  ): Promise<string> {
    // Get base template
    const template = this.getMessageTemplate(type, change.change_type, change.urgency_score || 5)
    
    // Replace variables
    let message = this.populateTemplate(template, {
      nome: person.name,
      primeiroNome: person.name.split(' ')[0],
      mudanca: this.getChangeDescription(change),
      data: new Date(change.detected_at).toLocaleDateString('pt-BR')
    })

    // If we have LLM analysis, use it to enhance the message
    if (llmAnalysis?.recommendedActions) {
      const action = llmAnalysis.recommendedActions.find(a => a.type === type)
      if (action?.reasoning) {
        // Add personalized touch based on LLM reasoning
        message = this.enhanceMessageWithLLMInsights(message, action.reasoning)
      }
    }

    return message
  }

  // Get message template based on type and context
  private getMessageTemplate(type: InitiativeType, changeType: string, urgency: number): string {
    const templates: Record<string, Record<InitiativeType, string>> = {
      'life_event': {
        'message': 'Olá {nome}! Soube que houve uma mudança importante em sua vida. Como você está? Estou aqui se precisar conversar. 🙏',
        'call': 'Ligação para {nome} sobre {mudanca} - verificar como está se adaptando e oferecer apoio.',
        'visit': 'Visita para {nome} - conversar pessoalmente sobre {mudanca} e oferecer suporte pastoral.'
      },
      'relationship': {
        'message': 'Oi {primeiroNome}! Vi que houve uma atualização em seus dados. Como você está? Se quiser conversar, estou disponível. Deus abençoe! ❤️',
        'call': 'Ligação para {nome} - conversar sobre mudança de status e oferecer apoio.',
        'visit': 'Visita para {nome} - acompanhar mudança de relacionamento e providenciar suporte.'
      },
      'engagement': {
        'message': 'Oi {primeiroNome}! Senti sua falta e gostaria de saber como você está. Que tal conversarmos em breve? 😊',
        'call': 'Ligação para {nome} - verificar motivo da ausência e demonstrar cuidado.',
        'visit': 'Visita para {nome} - reconectar e entender necessidades espirituais.'
      },
      'special_date': {
        'message': 'Feliz aniversário, {primeiroNome}! 🎉 Que Deus abençoe este novo ciclo da sua vida. Desejo muito amor e paz! ❤️',
        'call': 'Ligação de aniversário para {nome} - demonstrar cuidado e celebrar junto.',
        'visit': 'Visita de aniversário para {nome} - celebração presencial e fortalecimento de vínculo.'
      },
      'personal_data': {
        'message': 'Oi {primeiroNome}! Vi que você atualizou seus dados. Se houver algo em que posso ajudar, estarei aqui. Abraço! 🤗',
        'call': 'Ligação para {nome} - verificar se a mudança de dados indica alguma necessidade.',
        'visit': 'Visita para {nome} - acompanhar mudanças pessoais e oferecer suporte.'
      }
    }

    const typeTemplates = templates[changeType] || templates['personal_data']
    return typeTemplates[type]
  }

  // Populate template variables
  private populateTemplate(template: string, variables: Record<string, string>): string {
    let populated = template
    for (const [key, value] of Object.entries(variables)) {
      populated = populated.replace(new RegExp(`{${key}}`, 'g'), value)
    }
    return populated
  }

  // Enhance message with LLM insights
  private enhanceMessageWithLLMInsights(baseMessage: string, reasoning: string): string {
    // For now, just return the base message
    // In a more advanced implementation, we could use the LLM to enhance the message
    return baseMessage
  }

  // Calculate due date based on urgency and timing
  private calculateDueDate(urgencyScore: number, suggestedTiming?: string): Date {
    const now = new Date()
    const dueDate = new Date(now)

    // Use LLM suggested timing if available
    if (suggestedTiming) {
      switch (suggestedTiming) {
        case 'immediate':
          dueDate.setHours(now.getHours() + 2) // 2 hours
          break
        case 'this_week':
          dueDate.setDate(now.getDate() + 2) // 2 days
          break
        case 'this_month':
          dueDate.setDate(now.getDate() + 7) // 1 week
          break
        default:
          dueDate.setDate(now.getDate() + 3) // 3 days default
      }
    } else {
      // Fallback to urgency-based calculation
      if (urgencyScore >= 8) {
        dueDate.setHours(now.getHours() + 4) // 4 hours for high urgency
      } else if (urgencyScore >= 6) {
        dueDate.setDate(now.getDate() + 1) // 1 day for medium urgency
      } else {
        dueDate.setDate(now.getDate() + 3) // 3 days for lower urgency
      }
    }

    return dueDate
  }

  // Helper methods
  private async getProcessedChangesWithAnalysis(limit: number): Promise<Array<PeopleChange & { llmAnalysis?: LLMAnalysisResponse }>> {
    // Get changes that have been processed by LLM but haven't generated initiatives yet
    const processedChanges = await this.initiativeRepo.findUnprocessedChanges(limit * 2) // Get more to filter
    
    return processedChanges
      .filter(change => change.processed_at && change.ai_analysis)
      .slice(0, limit)
      .map(change => ({
        ...change,
        llmAnalysis: change.ai_analysis ? this.parseLLMAnalysis(change.ai_analysis) : undefined
      }))
  }

  private parseLLMAnalysis(aiAnalysis: Record<string, unknown>): LLMAnalysisResponse | undefined {
    try {
      if (aiAnalysis.llmAnalysis) {
        return aiAnalysis.llmAnalysis as LLMAnalysisResponse
      }
      return undefined
    } catch {
      return undefined
    }
  }

  private groupChangesByPerson(changes: PeopleChange[]): Map<string, PeopleChange[]> {
    const grouped = new Map<string, PeopleChange[]>()
    
    for (const change of changes) {
      const personId = change.person_id
      if (!grouped.has(personId)) {
        grouped.set(personId, [])
      }
      grouped.get(personId)!.push(change)
    }
    
    return grouped
  }

  private prioritizeChanges(changes: Array<PeopleChange & { llmAnalysis?: LLMAnalysisResponse }>): Array<PeopleChange & { llmAnalysis?: LLMAnalysisResponse }> {
    return changes.sort((a, b) => {
      const urgencyA = a.llmAnalysis?.overallUrgency || a.urgency_score || 5
      const urgencyB = b.llmAnalysis?.overallUrgency || b.urgency_score || 5
      return urgencyB - urgencyA // Descending order (highest urgency first)
    })
  }

  private async getRecentInitiatives(personId: string, days: number): Promise<Initiative[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return await this.initiativeRepo.getInitiativesByPersonId(personId)
  }

  private hasRecentSimilarInitiative(
    change: PeopleChange, 
    existingInitiatives: Initiative[]
  ): boolean {
    // Simple check for similar initiatives based on change type
    return existingInitiatives.some(initiative => {
      const initiativeAge = new Date().getTime() - new Date(initiative.created_at!).getTime()
      const daysSinceCreated = initiativeAge / (1000 * 60 * 60 * 24)
      
      return daysSinceCreated <= 7 && // Within last week
             initiative.change_id === change.id // Same change
    })
  }

  private getChangeDescription(change: PeopleChange): string {
    const descriptions: Record<string, string> = {
      'life_event': 'evento importante na vida',
      'engagement': 'mudança no engajamento',
      'personal_data': 'atualização de dados pessoais',
      'relationship': 'mudança no relacionamento',
      'special_date': 'data especial'
    }
    
    return descriptions[change.change_type] || 'mudança'
  }

  // Public methods for manual generation
  async generateForPerson(personId: string, maxInitiatives: number = 3): Promise<GenerationResult> {
    const startTime = Date.now()
    
    try {
      // Get unprocessed changes for this person
      const allChanges = await this.initiativeRepo.findUnprocessedChanges(50)
      const personChanges = allChanges.filter(c => c.person_id === personId && c.processed_at)
      
      if (personChanges.length === 0) {
        return {
          initiativesGenerated: 0,
          changesProcessed: 0,
          results: [],
          processingTime: Date.now() - startTime,
          errors: ['No processed changes found for this person']
        }
      }

      const result = await this.generateInitiativesForPerson(
        personId, 
        personChanges.map(c => ({
          ...c,
          llmAnalysis: this.parseLLMAnalysis(c.ai_analysis || {})
        })),
        { maxInitiatives }
      )

      return {
        initiativesGenerated: result.results.filter(r => r.initiativeId).length,
        changesProcessed: personChanges.length,
        results: result.results,
        processingTime: Date.now() - startTime,
        errors: result.errors
      }

    } catch (error) {
      return {
        initiativesGenerated: 0,
        changesProcessed: 0,
        results: [],
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}