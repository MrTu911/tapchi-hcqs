export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { successResponse } from '@/lib/responses'
import { handleError, AuthenticationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * GET /api/auth/me
 * Mô tả: Lấy thông tin user hiện tại
 * Auth: Optional (returns null if not authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_ME',
      message: 'Get current user request'
    });

    const user = await getCurrentUser()
    
    if (!user) {
      // Return null user instead of error for unauthenticated requests
      return NextResponse.json({
        success: true,
        data: { user: null }
      })
    }

    // Log success
    logger.info({
      context: 'API_AUTH_ME',
      message: 'User info retrieved',
      userId: user.id,
      userEmail: user.email
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role
      }
    })

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_ME',
      message: 'Get current user failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_ME')
  }
}
