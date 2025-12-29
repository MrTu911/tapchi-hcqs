
export const dynamic = "force-dynamic"

/**
 * ✅ Phase 2: 2FA Management API
 * GET: Get 2FA status
 * POST: Enable/Disable 2FA
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { verifyToken } from '@/lib/auth'
import { enable2FA, disable2FA, get2FAConfig, TwoFactorMethod } from '@/lib/two-factor'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
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

    // Get 2FA config
    const config = await get2FAConfig(payload.uid)

    return NextResponse.json({
      enabled: config?.isEnabled ?? false,
      method: config?.method ?? null
    })
  } catch (error: any) {
    logger.error({ message: 'Error getting 2FA status:', error: error instanceof Error ? error.message : String(error) })
    return handleError(error, 'API_AUTH')
  }
}

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
    const { action, method } = body

    const requestInfo = auditLogger.extractRequestInfo(request)

    if (action === 'enable') {
      const backupCodes = await enable2FA(
        payload.uid,
        method as TwoFactorMethod || TwoFactorMethod.EMAIL_OTP
      )

      await auditLogger.logSuccess(AuditEventType.USER_UPDATED, {
        userId: payload.uid,
        userEmail: payload.email,
        userRole: payload.role,
        details: { action: '2FA enabled', method },
        ...requestInfo
      })

      return NextResponse.json({
        message: '2FA đã được kích hoạt',
        backupCodes
      })
    } else if (action === 'disable') {
      await disable2FA(payload.uid)

      await auditLogger.logSuccess(AuditEventType.USER_UPDATED, {
        userId: payload.uid,
        userEmail: payload.email,
        userRole: payload.role,
        details: { action: '2FA disabled' },
        ...requestInfo
      })

      return NextResponse.json({
        message: '2FA đã được tắt'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    logger.error({ message: 'Error managing 2FA:', error: error instanceof Error ? error.message : String(error) })
    return handleError(error, 'API_AUTH')
  }
}
