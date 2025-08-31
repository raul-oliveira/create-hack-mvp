import { LLMClient, LLMAnalysisRequest, LLMAnalysisResponse } from '@/lib/ai/llm-client'
import { InitiativeRepository } from '@/lib/data/initiative-repository'
import { PeopleRepository } from '@/lib/data/people-repository'
import { PeopleChange, ChangeType } from '@/lib/schemas/initiatives'
import { Person } from '@/lib/schemas/people'

export interface ScoringServiceOptions {
  batchSize?: number
  maxConcurrency?: number
  includeHistoricalContext?: boolean
  organizationId?: string
}

export interface ScoringResult {
  changeId: string
  personId: string
  originalScore: number
  enhancedScore: number
  llmAnalysis: LLMAnalysisResponse | null
  processingTime: number
  error?: string
}

export interface BatchScoringResult {
  results: ScoringResult[]
  totalProcessed: number
  totalCost: number
  processingTime: number
  errors: string[]
}

export class LLMScoringService {
  private llmClient: LLMClient
  private initiativeRepo: InitiativeRepository
  private peopleRepo: PeopleRepository

  constructor() {
    this.llmClient = new LLMClient()
    this.initiativeRepo = new InitiativeRepository()
    this.peopleRepo = new PeopleRepository()
  }

  // Process unprocessed changes with LLM scoring
  async processUnprocessedChanges(
    organizationId?: string,
    options: ScoringServiceOptions = {}
  ): Promise<BatchScoringResult> {
    const { 
      batchSize = 20, 
      includeHistoricalContext = true 
    } = options

    const startTime = Date.now()
    const results: ScoringResult[] = []
    const errors: string[] = []
    let totalCost = 0

    try {
      // Get unprocessed changes
      const unprocessedChanges = await this.initiativeRepo.findUnprocessedChanges(batchSize)
      
      if (unprocessedChanges.length === 0) {
        return {
          results: [],
          totalProcessed: 0,
          totalCost: 0,
          processingTime: Date.now() - startTime,
          errors: []
        }
      }

      // Group changes by person for batch processing
      const changesByPerson = this.groupChangesByPerson(unprocessedChanges)

      // Process each person's changes
      for (const [personId, personChanges] of changesByPerson.entries()) {
        try {
          const result = await this.processPerson(personId, personChanges, {
            includeHistoricalContext,
            organizationId
          })
          
          results.push(...result.results)
          totalCost += result.totalCost
          errors.push(...result.errors)

          // Mark changes as processed
          for (const change of personChanges) {
            const matchingResult = result.results.find(r => r.changeId === change.id!)
            await this.initiativeRepo.markChangeAsProcessed(
              change.id!,
              matchingResult?.llmAnalysis ? {
                llmAnalysis: matchingResult.llmAnalysis,
                enhancedScore: matchingResult.enhancedScore,
                processingTime: matchingResult.processingTime
              } : undefined
            )
          }

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Error processing person ${personId}: ${message}`)
          
          // Mark changes as processed with error
          for (const change of personChanges) {
            await this.initiativeRepo.markChangeAsProcessed(change.id!, {
              error: message,
              fallbackScore: change.urgency_score
            })
          }
        }
      }

      return {
        results,
        totalProcessed: results.length,
        totalCost,
        processingTime: Date.now() - startTime,
        errors
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Batch processing error: ${message}`)
      
      return {
        results,
        totalProcessed: results.length,
        totalCost,
        processingTime: Date.now() - startTime,
        errors
      }
    }
  }

  // Process a single person's changes
  async processPerson(
    personId: string,
    changes: PeopleChange[],
    options: { includeHistoricalContext?: boolean; organizationId?: string } = {}
  ): Promise<{
    results: ScoringResult[]
    totalCost: number
    errors: string[]
  }> {
    const results: ScoringResult[] = []
    const errors: string[] = []
    let totalCost = 0

    try {
      // Get person details
      const person = await this.peopleRepo.findById(personId)
      if (!person) {
        throw new Error(`Person not found: ${personId}`)
      }

      // Build LLM request
      const request = await this.buildLLMRequest(person, changes, options)
      
      // Get LLM analysis
      const startTime = Date.now()
      const analysis = await this.llmClient.analyzeChanges(request)
      const processingTime = Date.now() - startTime

      // Calculate enhanced scores for each change
      for (const change of changes) {
        const originalScore = change.urgency_score || 5
        const enhancedScore = this.calculateEnhancedScore(originalScore, analysis)
        
        results.push({
          changeId: change.id!,
          personId: person.id!,
          originalScore,
          enhancedScore,
          llmAnalysis: analysis,
          processingTime
        })
      }

      // Estimate cost (rough approximation)
      totalCost = 0.01 // Approximate cost per analysis

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`LLM analysis error for person ${personId}: ${message}`)
      
      // Create fallback results
      for (const change of changes) {
        results.push({
          changeId: change.id!,
          personId,
          originalScore: change.urgency_score || 5,
          enhancedScore: change.urgency_score || 5,
          llmAnalysis: null,
          processingTime: 0,
          error: message
        })
      }
    }

    return { results, totalCost, errors }
  }

  // Build LLM analysis request
  private async buildLLMRequest(
    person: Person,
    changes: PeopleChange[],
    options: { includeHistoricalContext?: boolean; organizationId?: string } = {}
  ): Promise<LLMAnalysisRequest> {
    // Calculate person's age if birth date available
    let age: number | undefined
    if (person.birth_date) {
      const birthDate = new Date(person.birth_date)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    // Get engagement level (simplified)
    const engagementLevel = person.last_synced_at ? 
      this.calculateEngagementLevel(new Date(person.last_synced_at)) : 
      'unknown'

    // Get organization context
    let organizationContext
    if (options.organizationId) {
      // In a real implementation, you'd fetch organization details
      organizationContext = {
        name: 'Igreja Local',
        denomination: 'Evangélica',
        culture: 'Brazilian Pentecostal'
      }
    }

    // Convert changes to LLM format
    const llmChanges = changes.map(change => ({
      type: change.change_type,
      field: this.extractFieldFromChangeType(change),
      oldValue: change.old_value,
      newValue: change.new_value,
      detectedAt: new Date(change.detected_at),
      preliminaryScore: change.urgency_score || 5
    }))

    return {
      personContext: {
        id: person.id!,
        name: person.name,
        age,
        maritalStatus: person.marital_status || undefined,
        lastContact: person.last_synced_at ? new Date(person.last_synced_at) : undefined,
        engagementLevel
      },
      changes: llmChanges,
      organizationContext,
      leaderPreferences: {
        tone: 'caring and pastoral',
        approach: 'relationship-focused',
        priorities: ['spiritual_wellbeing', 'life_transitions', 'family_needs']
      }
    }
  }

  // Calculate enhanced score combining original + LLM analysis
  private calculateEnhancedScore(originalScore: number, analysis: LLMAnalysisResponse): number {
    // Weight: 40% original algorithm, 60% LLM analysis
    const originalWeight = 0.4
    const llmWeight = 0.6
    
    const enhancedScore = (originalScore * originalWeight) + (analysis.overallUrgency * llmWeight)
    
    // Apply timing adjustment
    const timingMultiplier = this.getTimingMultiplier(analysis.suggestedTiming)
    const finalScore = enhancedScore * timingMultiplier
    
    return Math.max(1, Math.min(10, Math.round(finalScore)))
  }

  private getTimingMultiplier(timing: string): number {
    switch (timing) {
      case 'immediate': return 1.2
      case 'this_week': return 1.0
      case 'this_month': return 0.8
      default: return 1.0
    }
  }

  // Helper methods
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

  private calculateEngagementLevel(lastSynced: Date): string {
    const daysSinceSync = Math.floor(
      (new Date().getTime() - lastSynced.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceSync <= 7) return 'high'
    if (daysSinceSync <= 30) return 'medium'
    if (daysSinceSync <= 90) return 'low'
    return 'inactive'
  }

  private extractFieldFromChangeType(change: PeopleChange): string {
    // Try to extract field from AI analysis or new_value structure
    if (change.ai_analysis && typeof change.ai_analysis === 'object') {
      const analysis = change.ai_analysis as Record<string, unknown>
      if (analysis.field && typeof analysis.field === 'string') {
        return analysis.field
      }
    }
    
    // Fallback to change type mapping
    const fieldMapping: Record<ChangeType, string> = {
      'life_event': 'major_life_change',
      'engagement': 'church_participation',
      'personal_data': 'contact_information',
      'relationship': 'marital_status',
      'special_date': 'birthday'
    }
    
    return fieldMapping[change.change_type as ChangeType] || 'general'
  }

  // Batch processing with better error handling
  async processChangesBatch(
    changes: PeopleChange[],
    options: ScoringServiceOptions = {}
  ): Promise<BatchScoringResult> {
    const { batchSize = 10 } = options
    const startTime = Date.now()
    
    // Split into smaller batches
    const batches = this.chunkArray(changes, batchSize)
    const allResults: ScoringResult[] = []
    const allErrors: string[] = []
    let totalCost = 0
    
    for (const batch of batches) {
      try {
        const changesByPerson = this.groupChangesByPerson(batch)
        
        for (const [personId, personChanges] of changesByPerson.entries()) {
          const result = await this.processPerson(personId, personChanges, options)
          allResults.push(...result.results)
          allErrors.push(...result.errors)
          totalCost += result.totalCost
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        allErrors.push(`Batch processing error: ${message}`)
      }
    }
    
    return {
      results: allResults,
      totalProcessed: allResults.length,
      totalCost,
      processingTime: Date.now() - startTime,
      errors: allErrors
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // Get service statistics
  async getStats(): Promise<{
    changesProcessedToday: number
    averageProcessingTime: number
    totalCostToday: number
    errorRate: number
  }> {
    const llmStats = await this.llmClient.getCostStats()
    
    return {
      changesProcessedToday: llmStats.requestsToday,
      averageProcessingTime: 0, // Would track in practice
      totalCostToday: llmStats.totalCost,
      errorRate: 0 // Would track in practice
    }
  }

  // Manual scoring trigger for testing
  async scoreChangesManually(personId: string): Promise<ScoringResult[]> {
    // Get recent unprocessed changes for this person
    const changes = await this.initiativeRepo.findUnprocessedChanges(10)
    const personChanges = changes.filter(c => c.person_id === personId)
    
    if (personChanges.length === 0) {
      return []
    }
    
    const result = await this.processPerson(personId, personChanges)
    
    // Mark as processed
    for (const change of personChanges) {
      const matchingResult = result.results.find(r => r.changeId === change.id!)
      await this.initiativeRepo.markChangeAsProcessed(
        change.id!,
        matchingResult?.llmAnalysis ? {
          llmAnalysis: matchingResult.llmAnalysis,
          enhancedScore: matchingResult.enhancedScore
        } : undefined
      )
    }
    
    return result.results
  }
}