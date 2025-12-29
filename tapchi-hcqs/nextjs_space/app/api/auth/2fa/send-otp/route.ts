
export const dynamic = "force-dynamic"

/**
 * ✅ Phase 2: Send OTP for 2FA verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { verifyToken } from '@/lib/auth'
import { createOTPToken, sendOTPEmail } from '@/lib/two-factor'
import { prisma } from '@/lib/prisma'

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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: payload.uid }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create and send OTP
    const otp = await createOTPToken(user.id)
    await sendOTPEmail(user.email, otp, user.fullName)

    return NextResponse.json({
      message: 'OTP đã được gửi đến email của bạn'
    })
  } catch (error: any) {
    logger.error({ message: 'Error sending OTP:', error: error instanceof Error ? error.message : String(error) })
    return handleError(error, 'API_AUTH')
  }
}
