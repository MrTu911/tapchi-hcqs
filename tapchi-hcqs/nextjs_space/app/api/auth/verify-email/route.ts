export const dynamic = "force-dynamic"

/**
 * GET /api/auth/verify-email
 * Mô tả: Xác thực email người dùng
 * Auth: Public (requires verification token)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/responses'
import { handleError, ValidationError, NotFoundError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_VERIFY_EMAIL',
      message: 'Email verification request'
    });

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      throw new ValidationError('Token xác thực không hợp lệ')
    }

    // Find user with this verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token }
    })

    if (!user) {
      throw new NotFoundError('Token xác thực không hợp lệ hoặc đã hết hạn')
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new ValidationError('Token xác thực đã hết hạn. Vui lòng đăng ký lại.')
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({
        context: 'API_AUTH_VERIFY_EMAIL',
        message: 'Email already verified',
        userId: user.id,
        userEmail: user.email
      });

      return successResponse(
        { verified: true },
        'Email đã được xác thực trước đó. Vui lòng chờ Ban biên tập phê duyệt tài khoản.'
      )
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    })

    // Log success
    logger.info({
      context: 'API_AUTH_VERIFY_EMAIL',
      message: 'Email verified successfully',
      userId: user.id,
      userEmail: user.email
    });

    return successResponse(
      { verified: true },
      'Xác thực email thành công! Tài khoản của bạn đang chờ Ban biên tập phê duyệt.'
    )

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_VERIFY_EMAIL',
      message: 'Email verification failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_VERIFY_EMAIL')
  }
}
