import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInChurchClient } from '@/lib/inchurch/api-client'
import { InChurchError } from '@/lib/inchurch/errors'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get leader and organization info
    const { data: leader } = await supabase
      .from('leaders')
      .select('id, organization_id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const updatedAfter = searchParams.get('updatedAfter')
    const status = searchParams.get('status') as 'active' | 'inactive' | 'pending' | 'all' || 'all'
    const search = searchParams.get('search')

    // Get InChurch client and fetch members
    const client = getInChurchClient()
    const result = await client.getMembers(leader.organization_id, {
      page,
      limit,
      updatedAfter: updatedAfter || undefined,
      status,
      search: search || undefined
    })

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        organizationId: leader.organization_id,
        leaderId: leader.id,
        rateLimitInfo: client.getRateLimitInfo(),
        cacheStats: client.getCacheStats()
      }
    })
  } catch (error) {
    console.error('Failed to fetch InChurch members:', error)
    
    if (error instanceof InChurchError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details
          }
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch members from InChurch'
      },
      { status: 500 }
    )
  }
}