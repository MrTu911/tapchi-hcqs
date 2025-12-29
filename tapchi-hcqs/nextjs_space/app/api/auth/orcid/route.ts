
export const dynamic = "force-dynamic"

/**
 * ORCID OAuth Initiation
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { getORCIDConfig, getORCIDAuthUrl } from '@/lib/integrations/orcid'

export async function GET(request: NextRequest) {
  try {
    const config = getORCIDConfig()

    if (!config.clientId) {
      return NextResponse.json(
        { error: 'ORCID integration not configured' },
        { status: 500 }
      )
    }

    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(7)

    // Store state in session (simplified - use proper session in production)
    const authUrl = getORCIDAuthUrl(config, state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    logger.error({ message: 'ORCID auth error:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to initialize ORCID authentication' },
      { status: 500 }
    )
  }
}
