
export const dynamic = "force-dynamic"

/**
 * ✅ Phase 2: Verify OTP for 2FA
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { verifyToken } from '@/lib/auth'
import { verifyOTPToken } from '@/lib/two-factor'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.cookies.get('accessToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { otp } = body

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 })
    }

    // Verify OTP
    const valid = await verifyOTPToken(payload.uid, otp)

    const requestInfo = auditLogger.extractRequestInfo(request)

    if (valid) {
      await auditLogger.logSuccess(AuditEventType.LOGIN_SUCCESS, {
        userId: payload.uid,
        userEmail: payload.email,
        userRole: payload.role,
        details: { method: '2FA OTP verification' },
        ...requestInfo
      })

      return NextResponse.json({
        valid: true,
        message: 'OTP xác thực thành công'
      })
    } else {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Invalid OTP',
        {
          userId: payload.uid,
          userEmail: payload.email,
          userRole: payload.role,
          ...requestInfo
        }
      )

      return NextResponse.json({
        valid: false,
        error: 'OTP không hợp lệ hoặc đã hết hạn'
      }, { status: 400 })
    }
  } catch (error: any) {
    logger.error({ message: 'Error verifying OTP:', error: error instanceof Error ? error.message : String(error) })
    return handleError(error, 'API_AUTH')
  }
}
