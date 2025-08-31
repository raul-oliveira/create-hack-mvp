import { NextRequest, NextResponse } from 'next/server'
import { LLMScoringService } from '@/lib/services/llm-scoring'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authorization (Vercel Cron or authorized request)
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting LLM scoring job...')
    
    const scoringService = new LLMScoringService()
    
    // Get all organizations that need scoring
    const organizations = await getOrganizationsNeedingScoring()
    
    const results: Record<string, any> = {}
    let totalProcessed = 0
    let totalCost = 0
    const errors: string[] = []
    
    // Process each organization
    for (const org of organizations) {
      try {
        console.log(`Processing LLM scoring for organization: ${org.id}`)
        
        const result = await scoringService.processUnprocessedChanges(org.id, {
          batchSize: 15, // Conservative batch size
          includeHistoricalContext: true
        })
        
        results[org.id] = {
          organizationName: org.name,
          changesProcessed: result.totalProcessed,
          cost: result.totalCost,
          errors: result.errors.length,
          processingTime: result.processingTime
        }
        
        totalProcessed += result.totalProcessed
        totalCost += result.totalCost
        errors.push(...result.errors)
        
        // Log result for this organization
        console.log(`Organization ${org.name}: ${result.totalProcessed} changes processed, $${result.totalCost.toFixed(4)} cost`)
        
        // Small delay between organizations to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error processing organization ${org.id}:`, error)
        
        errors.push(`Organization ${org.id}: ${message}`)
        results[org.id] = {
          organizationName: org.name,
          error: message
        }
      }
    }
    
    const executionTime = Date.now() - startTime
    
    // Log summary
    console.log(`LLM scoring completed in ${executionTime}ms:`, {
      organizationsProcessed: organizations.length,
      totalChangesProcessed: totalProcessed,
      totalCost: totalCost,
      errorsEncountered: errors.length
    })
    
    // Store execution log
    await logScoringExecution({
      organizationsProcessed: organizations.length,
      changesProcessed: totalProcessed,
      totalCost,
      executionTime,
      errors
    })
    
    return NextResponse.json({
      success: true,
      executionTime,
      summary: {
        organizationsProcessed: organizations.length,
        totalChangesProcessed: totalProcessed,
        totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
        errorsEncountered: errors.length
      },
      results
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    console.error('LLM scoring job failed:', error)
    
    await logScoringFailure({
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    })
    
    return NextResponse.json(
      { 
        error: 'LLM scoring job failed',
        executionTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function isAuthorizedCronRequest(request: NextRequest): boolean {
  // Check for Vercel Cron authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  // Check for Vercel internal header
  const vercelHeader = request.headers.get('x-vercel-cron')
  if (vercelHeader === '1') {
    return true
  }
  
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

async function getOrganizationsNeedingScoring(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient()
  
  try {
    // Get organizations that have unprocessed people changes
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        people_changes!inner(id)
      `)
      .is('people_changes.processed_at', null)
      .limit(10) // Limit to prevent excessive processing
    
    if (error) {
      console.error('Error fetching organizations:', error)
      return []
    }
    
    // Remove duplicates and format
    const uniqueOrgs = organizations?.reduce((acc, org) => {
      if (!acc.find(existing => existing.id === org.id)) {
        acc.push({
          id: org.id,
          name: org.name
        })
      }
      return acc
    }, [] as Array<{ id: string; name: string }>) || []
    
    return uniqueOrgs
    
  } catch (error) {
    console.error('Error in getOrganizationsNeedingScoring:', error)
    return []
  }
}

async function logScoringExecution(execution: {
  organizationsProcessed: number
  changesProcessed: number
  totalCost: number
  executionTime: number
  errors: string[]
}): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: null, // System-wide job
        sync_type: 'llm_scoring',
        status: execution.errors.length > 0 ? 'completed_with_errors' : 'completed',
        records_processed: execution.changesProcessed,
        execution_time_ms: execution.executionTime,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: execution.errors.length > 0 ? 
          `Errors: ${execution.errors.slice(0, 3).join('; ')}${execution.errors.length > 3 ? '...' : ''}` : 
          null
      })
  } catch (error) {
    console.error('Failed to log scoring execution:', error)
  }
}

async function logScoringFailure(failure: {
  error: string
  executionTime: number
}): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: null,
        sync_type: 'llm_scoring',
        status: 'failed',
        records_processed: 0,
        execution_time_ms: failure.executionTime,
        started_at: new Date().toISOString(),
        error_message: failure.error
      })
  } catch (error) {
    console.error('Failed to log scoring failure:', error)
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  // Only allow in development or with special auth
  const testAuth = request.nextUrl.searchParams.get('test_key')
  if (process.env.NODE_ENV !== 'development' && testAuth !== process.env.TEST_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = request.nextUrl.searchParams.get('org_id')
  
  try {
    const scoringService = new LLMScoringService()
    
    if (orgId) {
      // Process specific organization
      const result = await scoringService.processUnprocessedChanges(orgId, {
        batchSize: 5,
        includeHistoricalContext: true
      })
      
      return NextResponse.json({
        success: true,
        organizationId: orgId,
        result
      })
    } else {
      // Get service stats
      const stats = await scoringService.getStats()
      return NextResponse.json({
        success: true,
        stats
      })
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Manual scoring failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}