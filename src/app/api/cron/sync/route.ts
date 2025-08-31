import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SyncOrchestrator } from '@/lib/sync/orchestrator'
import { ChangeDetectionService } from '@/lib/services/change-detection'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting daily sync job...')
    
    const orchestrator = new SyncOrchestrator()
    const syncResult = await orchestrator.runDailySync()
    
    // Run change detection after sync
    console.log('Running change detection after sync...')
    const changeDetection = new ChangeDetectionService()
    const changeResults: Record<string, any> = {}
    
    for (const orgId of syncResult.processedOrganizations || []) {
      try {
        const result = await changeDetection.processBatch(orgId, {
          batchSize: 100,
          includeMinorChanges: false,
          maxAge: 48 // Check last 48 hours for changes
        })
        changeResults[orgId] = {
          changesDetected: result.changes.length,
          totalProcessed: result.totalProcessed,
          errors: result.errors.length
        }
      } catch (error) {
        console.error(`Change detection failed for org ${orgId}:`, error)
        changeResults[orgId] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    const executionTime = Date.now() - startTime
    
    console.log(`Daily sync and change detection completed in ${executionTime}ms:`, {
      organizationsProcessed: syncResult.organizationsProcessed,
      totalRecordsSynced: syncResult.totalRecordsSynced,
      syncErrors: syncResult.errors.length,
      changeDetectionResults: changeResults
    })
    
    return NextResponse.json({
      success: true,
      executionTime,
      result: {
        ...syncResult,
        changeDetection: changeResults
      }
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    console.error('Daily sync job failed:', error)
    
    await logSyncFailure(error instanceof Error ? error.message : 'Unknown error', executionTime)
    
    return NextResponse.json(
      { 
        error: 'Sync job failed',
        executionTime,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  const vercelCronSecret = request.headers.get('x-vercel-cron-signature')
  if (vercelCronSecret && process.env.VERCEL_ENV) {
    return true
  }
  
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

async function logSyncFailure(error: string, executionTime: number) {
  try {
    const supabase = await createClient()
    
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'daily_polling',
        status: 'failed',
        records_processed: 0,
        execution_time_ms: executionTime,
        error_message: error,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
  } catch (logError) {
    console.error('Failed to log sync failure:', logError)
  }
}