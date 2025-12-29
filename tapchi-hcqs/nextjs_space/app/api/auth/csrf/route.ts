export const dynamic = "force-dynamic"

/**
 * GET /api/auth/csrf
 * Mô tả: Lấy CSRF token cho NextAuth compatibility
 * Auth: Public
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

export async function GET() {
  try {
    logger.info({
      context: 'API_AUTH_CSRF',
      message: 'CSRF token request'
    });

    // Return CSRF token for compatibility
    return NextResponse.json({
      csrfToken: 'dummy-csrf-token-for-testing'
    })

  } catch (error) {
    logger.error({
      context: 'API_AUTH_CSRF',
      message: 'CSRF token request failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_CSRF')
  }
}
