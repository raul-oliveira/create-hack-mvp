import { NextRequest, NextResponse } from 'next/server'
import { InitiativeGenerationService } from '@/lib/services/initiative-generation'
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

    console.log('Starting initiative generation job...')
    
    const generationService = new InitiativeGenerationService()
    
    // Get organizations with processed changes needing initiative generation
    const organizations = await getOrganizationsNeedingGeneration()
    
    const results: Record<string, any> = {}
    let totalGenerated = 0
    let totalProcessed = 0
    const errors: string[] = []
    
    // Process each organization
    for (const org of organizations) {
      try {
        console.log(`Generating initiatives for organization: ${org.id}`)
        
        const result = await generationService.generateFromProcessedChanges({
          organizationId: org.id,
          maxInitiativesPerPerson: 3,
          batchSize: 30,
          skipDuplicates: true
        })
        
        results[org.id] = {
          organizationName: org.name,
          initiativesGenerated: result.initiativesGenerated,
          changesProcessed: result.changesProcessed,
          errors: result.errors.length,
          processingTime: result.processingTime
        }
        
        totalGenerated += result.initiativesGenerated
        totalProcessed += result.changesProcessed
        errors.push(...result.errors)
        
        // Log result for this organization
        console.log(`Organization ${org.name}: ${result.initiativesGenerated} initiatives generated from ${result.changesProcessed} changes`)
        
        // Small delay between organizations
        await new Promise(resolve => setTimeout(resolve, 500))
        
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
    console.log(`Initiative generation completed in ${executionTime}ms:`, {
      organizationsProcessed: organizations.length,
      totalInitiativesGenerated: totalGenerated,
      totalChangesProcessed: totalProcessed,
      errorsEncountered: errors.length
    })
    
    // Store execution log
    await logGenerationExecution({
      organizationsProcessed: organizations.length,
      initiativesGenerated: totalGenerated,
      changesProcessed: totalProcessed,
      executionTime,
      errors
    })
    
    return NextResponse.json({
      success: true,
      executionTime,
      summary: {
        organizationsProcessed: organizations.length,
        totalInitiativesGenerated: totalGenerated,
        totalChangesProcessed: totalProcessed,
        errorsEncountered: errors.length
      },
      results
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    console.error('Initiative generation job failed:', error)
    
    await logGenerationFailure({
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    })
    
    return NextResponse.json(
      { 
        error: 'Initiative generation job failed',
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

async function getOrganizationsNeedingGeneration(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient()
  
  try {
    // Get organizations that have processed people changes but no recent initiatives
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        people_changes!inner(
          id,
          person_id,
          processed_at
        )
      `)
      .not('people_changes.processed_at', 'is', null)
      .gte('people_changes.processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
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
    console.error('Error in getOrganizationsNeedingGeneration:', error)
    return []
  }
}

async function logGenerationExecution(execution: {
  organizationsProcessed: number
  initiativesGenerated: number
  changesProcessed: number
  executionTime: number
  errors: string[]
}): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: null, // System-wide job
        sync_type: 'initiative_generation',
        status: execution.errors.length > 0 ? 'completed_with_errors' : 'completed',
        records_processed: execution.initiativesGenerated,
        execution_time_ms: execution.executionTime,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: execution.errors.length > 0 ? 
          `Errors: ${execution.errors.slice(0, 3).join('; ')}${execution.errors.length > 3 ? '...' : ''}` : 
          null
      })
  } catch (error) {
    console.error('Failed to log generation execution:', error)
  }
}

async function logGenerationFailure(failure: {
  error: string
  executionTime: number
}): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: null,
        sync_type: 'initiative_generation',
        status: 'failed',
        records_processed: 0,
        execution_time_ms: failure.executionTime,
        started_at: new Date().toISOString(),
        error_message: failure.error
      })
  } catch (error) {
    console.error('Failed to log generation failure:', error)
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
  const personId = request.nextUrl.searchParams.get('person_id')
  
  try {
    const generationService = new InitiativeGenerationService()
    
    if (personId) {
      // Generate initiatives for specific person
      const result = await generationService.generateForPerson(personId, 3)
      
      return NextResponse.json({
        success: true,
        personId,
        result
      })
    } else if (orgId) {
      // Generate initiatives for specific organization
      const result = await generationService.generateFromProcessedChanges({
        organizationId: orgId,
        maxInitiativesPerPerson: 3,
        batchSize: 20,
        skipDuplicates: true
      })
      
      return NextResponse.json({
        success: true,
        organizationId: orgId,
        result
      })
    } else {
      // Get summary of what needs generation
      const orgs = await getOrganizationsNeedingGeneration()
      return NextResponse.json({
        success: true,
        organizationsNeedingGeneration: orgs.length,
        organizations: orgs
      })
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Manual generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}