import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { InChurchWebhookEvent } from '@/lib/inchurch/types'
import { ChangeDetectionService } from '@/lib/services/change-detection'

interface WebhookProcessingResult {
  success: boolean
  eventId: string
  eventType: string
  processed: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-inchurch-signature')
    
    if (!signature) {
      console.error('Missing webhook signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event: InChurchWebhookEvent = JSON.parse(body)
    
    if (!isValidWebhookEvent(event)) {
      console.error('Invalid webhook event structure:', event)
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      )
    }

    const result = await processWebhookEvent(event, Date.now() - startTime)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        eventId: result.eventId,
        processed: result.processed
      })
    } else {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Webhook endpoint error:', error)
    
    await logWebhookFailure({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.INCHURCH_WEBHOOK_SECRET
  
  if (!secret) {
    console.error('INCHURCH_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')
  
  const receivedSignature = signature.replace('sha256=', '')
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  )
}

function isValidWebhookEvent(event: unknown): event is InChurchWebhookEvent {
  if (!event || typeof event !== 'object') {
    return false
  }
  
  const eventObj = event as Record<string, unknown>
  return (
    typeof eventObj.id === 'string' &&
    typeof eventObj.type === 'string' &&
    typeof eventObj.timestamp === 'string' &&
    typeof eventObj.organizationId === 'string' &&
    eventObj.data !== undefined &&
    ['member.created', 'member.updated', 'member.deleted', 'group.updated'].includes(eventObj.type)
  )
}

async function processWebhookEvent(
  event: InChurchWebhookEvent,
  processingTime: number
): Promise<WebhookProcessingResult> {
  const supabase = await createClient()
  
  try {
    const { data: existingLog, error: checkError } = await supabase
      .from('sync_logs')
      .select('id')
      .eq('sync_type', 'webhook')
      .eq('records_processed', 1)
      .contains('error_message', event.id)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    if (existingLog) {
      console.log(`Webhook event ${event.id} already processed`)
      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        processed: false
      }
    }

    const isCriticalEvent = isCriticalEventType(event.type, event.data)
    
    if (isCriticalEvent) {
      await processCriticalEvent(event)
    } else {
      await queueEventForProcessing(event)
    }

    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        organization_id: event.organizationId,
        sync_type: 'webhook',
        status: 'completed',
        records_processed: 1,
        execution_time_ms: processingTime,
        started_at: new Date(event.timestamp),
        completed_at: new Date().toISOString(),
        error_message: `Event: ${event.id}`
      })
    
    if (logError) {
      console.error('Failed to log webhook processing:', logError)
    }
    
    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
      processed: true
    }
    
  } catch (error) {
    console.error('Error processing webhook event:', error)
    
    await supabase
      .from('sync_logs')
      .insert({
        organization_id: event.organizationId,
        sync_type: 'webhook',
        status: 'failed',
        records_processed: 0,
        execution_time_ms: processingTime,
        started_at: new Date(event.timestamp),
        error_message: `Event: ${event.id} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    
    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function isCriticalEventType(eventType: string, eventData: unknown): boolean {
  if (eventType === 'member.deleted') {
    return true
  }
  
  if (eventType === 'member.updated' && eventData && typeof eventData === 'object') {
    const criticalFields = ['maritalStatus', 'address', 'phone']
    const data = eventData as Record<string, unknown>
    return criticalFields.some(field => field in data)
  }
  
  return false
}

async function processCriticalEvent(event: InChurchWebhookEvent) {
  console.log(`Processing critical event: ${event.type} for ${event.id}`)
  
  if (event.type === 'member.updated' || event.type === 'member.created') {
    await updatePersonRecord(event)
    await triggerChangeDetection(event)
  }
  
  await generateChangeDetectionRecord(event)
}

async function queueEventForProcessing(event: InChurchWebhookEvent) {
  console.log(`Queuing event for batch processing: ${event.type} for ${event.id}`)
  
  await generateChangeDetectionRecord(event)
  
  // For non-critical events, still trigger change detection but with lower priority
  if (event.type === 'member.updated') {
    await triggerChangeDetection(event, { lowPriority: true })
  }
}

async function updatePersonRecord(event: InChurchWebhookEvent) {
  const supabase = await createClient()
  
  try {
    const memberData = event.data as unknown as Record<string, unknown>
    
    const { error } = await supabase
      .from('people')
      .upsert({
        inchurch_member_id: memberData.id,
        organization_id: event.organizationId,
        name: memberData.name || 'Nome não informado',
        email: memberData.email,
        phone: memberData.phone,
        birth_date: memberData.birthDate,
        marital_status: memberData.maritalStatus,
        address: memberData.address ? JSON.stringify(memberData.address) : null,
        profile_data: memberData,
        sync_source: 'webhook',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,inchurch_member_id',
        ignoreDuplicates: false
      })
    
    if (error) {
      console.error('Failed to update person record:', error)
      throw error
    }
    
  } catch (error) {
    console.error('Error updating person record:', error)
    throw error
  }
}

async function triggerChangeDetection(event: InChurchWebhookEvent, options: { lowPriority?: boolean } = {}) {
  try {
    const changeDetection = new ChangeDetectionService()
    const memberData = event.data as unknown as Record<string, unknown>
    
    // Get current person data
    const supabase = await createClient()
    const { data: currentPerson, error } = await supabase
      .from('people')
      .select('*')
      .eq('inchurch_member_id', memberData.id)
      .eq('organization_id', event.organizationId)
      .maybeSingle()
    
    if (error || !currentPerson) {
      console.error('Person not found for change detection:', error)
      return
    }
    
    // For webhook events, we need to compare against previous state
    // In practice, you'd store person history or get from cache
    // For now, we'll create a basic change record
    await changeDetection.processBatch(event.organizationId, {
      batchSize: 1,
      includeMinorChanges: !options.lowPriority,
      maxAge: 1 // Only recent changes
    })
    
  } catch (error) {
    console.error('Error triggering change detection:', error)
  }
}

async function generateChangeDetectionRecord(event: InChurchWebhookEvent) {
  const supabase = await createClient()
  
  try {
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('id')
      .eq('inchurch_member_id', (event.data as unknown as Record<string, unknown>).id)
      .eq('organization_id', event.organizationId)
      .maybeSingle()
    
    if (personError) {
      console.error('Error finding person for change detection:', personError)
      return
    }
    
    if (person) {
      const { error: changeError } = await supabase
        .from('people_changes')
        .insert({
          person_id: person.id,
          change_type: mapEventTypeToChangeType(event.type),
          new_value: event.data,
          detected_at: new Date(event.timestamp),
          urgency_score: isCriticalEventType(event.type, event.data) ? 8 : 5
        })
      
      if (changeError) {
        console.error('Failed to create change detection record:', changeError)
      }
    }
    
  } catch (error) {
    console.error('Error generating change detection record:', error)
  }
}

function mapEventTypeToChangeType(eventType: string): string {
  switch (eventType) {
    case 'member.created':
      return 'life_event'
    case 'member.updated':
      return 'personal_data'
    case 'member.deleted':
      return 'life_event'
    case 'group.updated':
      return 'engagement'
    default:
      return 'personal_data'
  }
}

async function logWebhookFailure(failure: {
  error: string
  timestamp: string
  processingTime: number
}) {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'webhook',
        status: 'failed',
        records_processed: 0,
        execution_time_ms: failure.processingTime,
        error_message: failure.error,
        started_at: failure.timestamp,
        completed_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log webhook failure:', error)
  }
}