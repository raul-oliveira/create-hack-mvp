import OpenAI from 'openai'

export interface LLMAnalysisRequest {
  personContext: {
    id: string
    name: string
    age?: number
    maritalStatus?: string
    lastContact?: Date
    engagementLevel?: string
  }
  changes: Array<{
    type: string
    field: string
    oldValue: unknown
    newValue: unknown
    detectedAt: Date
    preliminaryScore: number
  }>
  organizationContext?: {
    name: string
    denomination?: string
    culture?: string
  }
  leaderPreferences?: {
    tone?: string
    approach?: string
    priorities?: string[]
  }
}

export interface LLMAnalysisResponse {
  overallUrgency: number // 1-10 scale
  contextualAnalysis: string
  recommendedActions: Array<{
    type: 'message' | 'call' | 'visit'
    priority: number
    reasoning: string
    confidence: number
  }>
  pastoralNotes: string
  suggestedTiming: 'immediate' | 'this_week' | 'this_month'
  customizations?: Record<string, unknown>
}

export interface LLMBatchRequest {
  requests: LLMAnalysisRequest[]
  batchId: string
  organizationId: string
}

export interface LLMBatchResponse {
  batchId: string
  results: Array<{
    personId: string
    analysis: LLMAnalysisResponse | null
    error?: string
  }>
  totalProcessed: number
  totalCost: number
  processingTime: number
}

export class LLMClient {
  private client: OpenAI
  private rateLimiter: RateLimiter
  private costTracker: CostTracker

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.rateLimiter = new RateLimiter({
      maxRequestsPerMinute: 50, // Conservative limit
      maxTokensPerMinute: 40000
    })
    
    this.costTracker = new CostTracker()
  }

  // Single analysis
  async analyzeChanges(request: LLMAnalysisRequest): Promise<LLMAnalysisResponse> {
    await this.rateLimiter.waitIfNeeded()

    const prompt = this.buildAnalysisPrompt(request)
    const startTime = Date.now()

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // More cost-effective than gpt-4
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(request.leaderPreferences, request.organizationContext)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent results
        response_format: { type: 'json_object' }
      })

      const processingTime = Date.now() - startTime
      const usage = completion.usage

      // Track costs
      if (usage) {
        await this.costTracker.trackUsage({
          model: 'gpt-4o-mini',
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          cost: this.calculateCost('gpt-4o-mini', usage.prompt_tokens, usage.completion_tokens)
        })
      }

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('Empty response from LLM')
      }

      const analysis = JSON.parse(response) as LLMAnalysisResponse
      
      // Validate and sanitize response
      return this.validateAndSanitizeResponse(analysis)

    } catch (error) {
      console.error('LLM analysis error:', error)
      
      // Return fallback analysis
      return this.getFallbackAnalysis(request)
    }
  }

  // Batch analysis for cost efficiency
  async analyzeBatch(request: LLMBatchRequest): Promise<LLMBatchResponse> {
    const startTime = Date.now()
    const results: LLMBatchResponse['results'] = []
    let totalCost = 0

    // Process in smaller batches to avoid token limits
    const batchSize = 5
    const batches = this.chunkArray(request.requests, batchSize)

    for (const batch of batches) {
      try {
        await this.rateLimiter.waitIfNeeded()

        const batchPrompt = this.buildBatchPrompt(batch)
        
        const completion = await this.client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.getBatchSystemPrompt()
            },
            {
              role: 'user',
              content: batchPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })

        const usage = completion.usage
        if (usage) {
          const batchCost = this.calculateCost('gpt-4o-mini', usage.prompt_tokens, usage.completion_tokens)
          totalCost += batchCost
          
          await this.costTracker.trackUsage({
            model: 'gpt-4o-mini',
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            cost: batchCost
          })
        }

        const response = completion.choices[0]?.message?.content
        if (response) {
          const batchResults = JSON.parse(response) as Array<{
            personId: string
            analysis: LLMAnalysisResponse
          }>
          
          results.push(...batchResults.map(result => ({
            personId: result.personId,
            analysis: this.validateAndSanitizeResponse(result.analysis),
            error: undefined
          })))
        }

      } catch (error) {
        console.error('Batch processing error:', error)
        
        // Add fallback results for this batch
        for (const req of batch) {
          results.push({
            personId: req.personContext.id,
            analysis: this.getFallbackAnalysis(req),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return {
      batchId: request.batchId,
      results,
      totalProcessed: results.length,
      totalCost,
      processingTime: Date.now() - startTime
    }
  }

  // Prompt building methods
  private buildAnalysisPrompt(request: LLMAnalysisRequest): string {
    const { personContext, changes, organizationContext } = request

    return `
Analyze the following changes in a church member's profile and provide pastoral care recommendations.

PERSON CONTEXT:
- Name: ${personContext.name}
- Age: ${personContext.age || 'Unknown'}
- Marital Status: ${personContext.maritalStatus || 'Unknown'}
- Last Contact: ${personContext.lastContact ? personContext.lastContact.toLocaleDateString() : 'Unknown'}
- Engagement Level: ${personContext.engagementLevel || 'Unknown'}

DETECTED CHANGES:
${changes.map(change => `
- Field: ${change.field}
- Change Type: ${change.type}
- From: ${JSON.stringify(change.oldValue)}
- To: ${JSON.stringify(change.newValue)}
- Detected: ${change.detectedAt.toLocaleDateString()}
- Preliminary Score: ${change.preliminaryScore}/10
`).join('')}

CHURCH CONTEXT:
- Organization: ${organizationContext?.name || 'Unknown'}
- Denomination: ${organizationContext?.denomination || 'Unknown'}

Please provide your analysis in the following JSON format:
{
  "overallUrgency": <1-10 number>,
  "contextualAnalysis": "<your analysis of the changes and their significance>",
  "recommendedActions": [
    {
      "type": "message|call|visit",
      "priority": <1-10 number>,
      "reasoning": "<why this action is recommended>",
      "confidence": <0.0-1.0 number>
    }
  ],
  "pastoralNotes": "<notes for the leader about pastoral care considerations>",
  "suggestedTiming": "immediate|this_week|this_month"
}
    `.trim()
  }

  private buildBatchPrompt(requests: LLMAnalysisRequest[]): string {
    return `
Analyze the following batch of church member profile changes and provide pastoral care recommendations for each.

${requests.map((request, index) => `
PERSON ${index + 1}:
ID: ${request.personContext.id}
Name: ${request.personContext.name}
Changes: ${request.changes.map(c => `${c.field}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`).join(', ')}
`).join('\n')}

Provide analysis for each person in this JSON format:
{
  "results": [
    {
      "personId": "<person_id>",
      "analysis": {
        "overallUrgency": <1-10>,
        "contextualAnalysis": "<analysis>",
        "recommendedActions": [{"type": "message|call|visit", "priority": <1-10>, "reasoning": "<reason>", "confidence": <0-1>}],
        "pastoralNotes": "<notes>",
        "suggestedTiming": "immediate|this_week|this_month"
      }
    }
  ]
}
    `.trim()
  }

  private getSystemPrompt(preferences?: LLMAnalysisRequest['leaderPreferences'], orgContext?: LLMAnalysisRequest['organizationContext']): string {
    const tone = preferences?.tone || 'caring and professional'
    const approach = preferences?.approach || 'balanced pastoral care'
    
    return `
You are an AI assistant helping church leaders provide better pastoral care by analyzing changes in their members' lives.

Your role is to:
1. Analyze detected changes in member profiles with cultural and spiritual sensitivity
2. Assess the urgency and significance of these changes
3. Recommend appropriate pastoral care actions (message, call, visit)
4. Provide practical guidance for leaders

Guidelines:
- Be sensitive to religious and cultural contexts
- Consider the pastoral relationship and appropriate boundaries
- Prioritize significant life events and emotional needs
- Balance urgency with practical leadership capacity
- Provide actionable, specific recommendations

Tone: ${tone}
Approach: ${approach}
Context: Church pastoral care and relationship management

Always respond with valid JSON format as requested.
    `.trim()
  }

  private getBatchSystemPrompt(): string {
    return `
You are an AI assistant analyzing multiple church member profile changes for pastoral care recommendations. 
Process each person's changes efficiently while maintaining quality analysis.
Focus on the most significant changes and provide practical, actionable recommendations.
Always respond with valid JSON format containing all requested persons.
    `.trim()
  }

  // Utility methods
  private validateAndSanitizeResponse(analysis: LLMAnalysisResponse): LLMAnalysisResponse {
    return {
      overallUrgency: Math.max(1, Math.min(10, Math.round(analysis.overallUrgency || 5))),
      contextualAnalysis: (analysis.contextualAnalysis || '').substring(0, 500),
      recommendedActions: (analysis.recommendedActions || []).slice(0, 3).map(action => ({
        type: ['message', 'call', 'visit'].includes(action.type) ? action.type as 'message' | 'call' | 'visit' : 'message',
        priority: Math.max(1, Math.min(10, Math.round(action.priority || 5))),
        reasoning: (action.reasoning || '').substring(0, 200),
        confidence: Math.max(0, Math.min(1, action.confidence || 0.5))
      })),
      pastoralNotes: (analysis.pastoralNotes || '').substring(0, 300),
      suggestedTiming: ['immediate', 'this_week', 'this_month'].includes(analysis.suggestedTiming) ? analysis.suggestedTiming : 'this_week',
      customizations: analysis.customizations
    }
  }

  private getFallbackAnalysis(request: LLMAnalysisRequest): LLMAnalysisResponse {
    const avgScore = request.changes.reduce((sum, c) => sum + c.preliminaryScore, 0) / request.changes.length

    return {
      overallUrgency: Math.round(avgScore),
      contextualAnalysis: `Automated analysis: Detected ${request.changes.length} change(s) for ${request.personContext.name}. Manual review recommended.`,
      recommendedActions: [{
        type: avgScore >= 7 ? 'call' : 'message',
        priority: Math.round(avgScore),
        reasoning: 'Fallback recommendation based on change significance',
        confidence: 0.3
      }],
      pastoralNotes: 'AI analysis unavailable. Please review changes manually.',
      suggestedTiming: avgScore >= 8 ? 'immediate' : avgScore >= 6 ? 'this_week' : 'this_month'
    }
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // GPT-4o-mini pricing as of 2024 (approximate)
    const promptCost = promptTokens * 0.00015 / 1000 // $0.15 per 1k prompt tokens
    const completionCost = completionTokens * 0.0006 / 1000 // $0.60 per 1k completion tokens
    return promptCost + completionCost
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // Get cost statistics
  async getCostStats(): Promise<{
    totalCost: number
    requestsToday: number
    averageCostPerRequest: number
  }> {
    return await this.costTracker.getStats()
  }
}

// Rate limiting helper
class RateLimiter {
  private requests: Date[] = []
  private tokens: Array<{ timestamp: Date; count: number }> = []

  constructor(private options: {
    maxRequestsPerMinute: number
    maxTokensPerMinute: number
  }) {}

  async waitIfNeeded(): Promise<void> {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)

    // Clean old entries
    this.requests = this.requests.filter(req => req > oneMinuteAgo)
    this.tokens = this.tokens.filter(token => token.timestamp > oneMinuteAgo)

    // Check request limit
    if (this.requests.length >= this.options.maxRequestsPerMinute) {
      const oldestRequest = this.requests[0]
      const waitTime = 60000 - (now.getTime() - oldestRequest.getTime())
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    this.requests.push(now)
  }
}

// Cost tracking helper
class CostTracker {
  private usage: Array<{
    timestamp: Date
    model: string
    promptTokens: number
    completionTokens: number
    cost: number
  }> = []

  async trackUsage(usage: {
    model: string
    promptTokens: number
    completionTokens: number
    cost: number
  }): Promise<void> {
    this.usage.push({
      timestamp: new Date(),
      ...usage
    })

    // Keep only last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    this.usage = this.usage.filter(u => u.timestamp > thirtyDaysAgo)
  }

  async getStats(): Promise<{
    totalCost: number
    requestsToday: number
    averageCostPerRequest: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUsage = this.usage.filter(u => u.timestamp >= today)
    const totalCost = todayUsage.reduce((sum, u) => sum + u.cost, 0)
    const requestsToday = todayUsage.length

    return {
      totalCost,
      requestsToday,
      averageCostPerRequest: requestsToday > 0 ? totalCost / requestsToday : 0
    }
  }
}