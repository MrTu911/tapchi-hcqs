export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSecureCookieOptions } from '@/lib/auth'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/logout
 * Mô tả: Đăng xuất khỏi hệ thống
 * Auth: Optional (clears tokens regardless)
 */
export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_LOGOUT',
      message: 'Logout attempt'
    });

    const requestInfo = auditLogger.extractRequestInfo(request)
    const session = await getServerSession()
    
    if (session) {
      await auditLogger.logSuccess(
        AuditEventType.LOGOUT,
        {
          userId: session.uid,
          userEmail: session.email,
          userRole: session.role,
          ...requestInfo
        }
      )

      // Log success
      logger.info({
        context: 'API_AUTH_LOGOUT',
        message: 'User logged out',
        userId: session.uid,
        userEmail: session.email
      });
    }

    const response = NextResponse.json({ 
      success: true, 
      message: 'Đăng xuất thành công' 
    })

    // Xóa cả access token và refresh token
    const cookieOptions = getSecureCookieOptions()

    response.cookies.set('auth-token', '', {
      ...cookieOptions,
      maxAge: 0
    })

    response.cookies.set('refresh-token', '', {
      ...cookieOptions,
      maxAge: 0
    })

    return response

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_LOGOUT',
      message: 'Logout failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_LOGOUT')
  }
}
