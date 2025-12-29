export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken, signToken, getSecureCookieOptions } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/responses'
import { logAudit } from '@/lib/audit-logger'
import { prisma } from '@/lib/prisma'
import { handleError, AuthenticationError, NotFoundError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * ✅ B1: JWT Refresh Token API
 * POST /api/auth/refresh
 * Làm mới access token bằng refresh token
 * Auth: Required (refresh token)
 */
export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_REFRESH',
      message: 'Token refresh attempt',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh-token')?.value

    if (!refreshToken) {
      throw new AuthenticationError('Không tìm thấy refresh token')
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded) {
      await logAudit({
        action: 'TOKEN_INVALID',
        object: 'RefreshToken',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      })
      throw new AuthenticationError('Refresh token không hợp lệ hoặc đã hết hạn')
    }

    // Kiểm tra user còn active không
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.uid,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    })

    if (!user) {
      await logAudit({
        action: 'ACCESS_DENIED',
        object: 'User:' + decoded.uid,
        after: { email: decoded.email }
      })
      throw new NotFoundError('Tài khoản không hợp lệ hoặc không hoạt động')
    }

    // Tạo access token mới
    const newAccessToken = signToken({
      uid: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    })

    // Set cookie mới
    const cookieOptions = getSecureCookieOptions()
    cookieStore.set('auth-token', newAccessToken, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 // 8 giờ
    })

    // Audit log
    await logAudit({
      actorId: user.id,
      action: 'TOKEN_REFRESH',
      object: 'AccessToken',
      after: { email: user.email },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Log success
    logger.info({
      context: 'API_AUTH_REFRESH',
      message: 'Token refreshed successfully',
      userId: user.id,
      userEmail: user.email
    });

    return successResponse({ 
      token: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    }, 'Làm mới token thành công')

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_REFRESH',
      message: 'Token refresh failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_REFRESH')
  }
}
