export const dynamic = "force-dynamic"

/**
 * GET /api/auth/reset-password
 * Mô tả: Xác minh token đặt lại mật khẩu
 * Auth: Public
 * 
 * POST /api/auth/reset-password
 * Mô tả: Đặt lại mật khẩu mới
 * Auth: Public (requires valid reset token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, verifyResetToken } from '@/lib/password-reset'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { handleError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_RESET_PASSWORD_VERIFY',
      message: 'Reset token verification request'
    });

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      throw new ValidationError('Token là bắt buộc')
    }

    const result = await verifyResetToken(token)

    // Log result
    logger.info({
      context: 'API_AUTH_RESET_PASSWORD_VERIFY',
      message: 'Token verification completed',
      valid: result.valid
    });

    return NextResponse.json({
      valid: result.valid,
      message: result.message
    })

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_RESET_PASSWORD_VERIFY',
      message: 'Token verification failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_RESET_PASSWORD_VERIFY')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_RESET_PASSWORD',
      message: 'Password reset attempt'
    });

    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      throw new ValidationError('Token và mật khẩu mới là bắt buộc')
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new ValidationError('Mật khẩu phải có ít nhất 8 ký tự')
    }

    const requestInfo = auditLogger.extractRequestInfo(request)

    const result = await resetPassword(token, newPassword)

    if (result.success) {
      await auditLogger.logSuccess(AuditEventType.PASSWORD_CHANGED, {
        details: { action: 'Password reset completed' },
        ...requestInfo
      })

      // Log success
      logger.info({
        context: 'API_AUTH_RESET_PASSWORD',
        message: 'Password reset successful'
      });
    }

    return NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 })

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_RESET_PASSWORD',
      message: 'Password reset failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_RESET_PASSWORD')
  }
}
