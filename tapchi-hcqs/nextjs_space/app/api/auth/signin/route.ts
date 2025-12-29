export const dynamic = "force-dynamic"

/**
 * GET /api/auth/signin
 * Mô tả: Lấy thông tin trang đăng nhập
 * Auth: Public
 * 
 * POST /api/auth/signin
 * Mô tả: Đăng nhập hệ thống
 * Auth: Public
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { successResponse, validationErrorResponse } from '@/lib/responses'
import { handleError, AuthenticationError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống')
})

export async function GET(request: NextRequest) {
  try {
    logger.info({
      context: 'API_AUTH_SIGNIN_INFO',
      message: 'Signin info request'
    });

    // Return signin page info for compatibility
    return NextResponse.json({
      url: '/auth/login',
      providers: ['credentials']
    })
  } catch (error) {
    logger.error({
      context: 'API_AUTH_SIGNIN_INFO',
      message: 'Signin info failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_SIGNIN_INFO')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_AUTH_SIGNIN',
      message: 'Sign in attempt',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return validationErrorResponse(errors)
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.isActive) {
      throw new AuthenticationError('Email hoặc mật khẩu không đúng')
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new AuthenticationError('Email hoặc mật khẩu không đúng')
    }

    // Create token
    const token = signToken({
      uid: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    })

    // Log success
    logger.info({
      context: 'API_AUTH_SIGNIN',
      message: 'User signed in successfully',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role
    });

    // Create response with cookie
    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role
      }
    }, 'Đăng nhập thành công')

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 // 8 hours
    })

    return response

  } catch (error) {
    // Log error
    logger.error({
      context: 'API_AUTH_SIGNIN',
      message: 'Sign in failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_AUTH_SIGNIN')
  }
}
