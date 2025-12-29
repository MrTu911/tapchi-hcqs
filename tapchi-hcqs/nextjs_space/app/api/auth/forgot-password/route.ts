export const dynamic = "force-dynamic"

/**
 * POST /api/auth/forgot-password
 * Mô tả: Yêu cầu đặt lại mật khẩu
 * Auth: Public
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPasswordResetToken } from '@/lib/password-reset'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { handleError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_FORGOT_PASSWORD',
      message: 'Password reset request'
    });

    const body = await request.json()
    const { email } = body

    if (!email) {
      throw new ValidationError('Email là bắt buộc')
    }

    const requestInfo = auditLogger.extractRequestInfo(request)

    const result = await createPasswordResetToken(email)

    // Log attempt (don't reveal if email exists)
    await auditLogger.logSuccess(AuditEventType.PASSWORD_CHANGED, {
      userEmail: email,
      details: { action: 'Password reset requested' },
      ...requestInfo
    })

    // Log success
    logger.info({
      context: 'API_AUTH_FORGOT_PASSWORD',
      message: 'Password reset email sent',
      email: email
    });

    return NextResponse.json({
      success: true,
      message: result.message
    })

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_FORGOT_PASSWORD',
      message: 'Password reset request failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_FORGOT_PASSWORD')
  }
}
