import { NextRequest, NextResponse } from 'next/server'
import { getInChurchClient } from '@/lib/inchurch/api-client'
import { InChurchError } from '@/lib/inchurch/errors'

export async function GET(request: NextRequest) {
  try {
    // Check if InChurch configuration is available
    if (!process.env.INCHURCH_API_KEY || !process.env.INCHURCH_API_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'InChurch API credentials not configured',
          configured: false
        },
        { status: 503 }
      )
    }

    const client = getInChurchClient()
    
    // Test the connection
    const healthCheck = await client.checkHealth()
    const rateLimitInfo = client.getRateLimitInfo()
    const cacheStats = client.getCacheStats()

    return NextResponse.json({
      success: true,
      data: {
        status: 'connected',
        health: healthCheck,
        rateLimit: rateLimitInfo,
        cache: cacheStats,
        configured: true
      }
    })
  } catch (error) {
    console.error('InChurch health check failed:', error)
    
    if (error instanceof InChurchError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            status: error.status
          },
          configured: true
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown error occurred',
        configured: true
      },
      { status: 500 }
    )
  }
}