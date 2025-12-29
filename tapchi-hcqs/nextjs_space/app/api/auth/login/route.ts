

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, signRefreshToken, getSecureCookieOptions } from '@/lib/auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/responses'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'
import { loginSchema, sanitizeEmail } from '@/lib/validation'
import { checkBruteForce } from '@/lib/security-monitor'

export async function POST(request: NextRequest) {
  const requestInfo = auditLogger.extractRequestInfo(request)

  try {
    // Validate input with enhanced security
    const body = await request.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Validation error',
        {
          userEmail: body.email,
          ...requestInfo,
          details: { errors }
        }
      )
      
      return validationErrorResponse(errors, 'Dữ liệu không hợp lệ')
    }

    const { email, password } = validation.data

    // ✅ Check brute force attempts (both email and IP)
    const emailBruteForce = await checkBruteForce(email, 'email')
    const ipBruteForce = await checkBruteForce(requestInfo.ipAddress, 'ip')

    if (emailBruteForce.blocked || ipBruteForce.blocked) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Brute force protection triggered',
        {
          userEmail: email,
          ...requestInfo,
          details: {
            emailAttempts: emailBruteForce.attempts,
            ipAttempts: ipBruteForce.attempts
          }
        }
      )
      
      return errorResponse(
        'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        429
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'User không tồn tại',
        {
          userEmail: email,
          ...requestInfo
        }
      )
      return errorResponse('Email hoặc mật khẩu không đúng', 401)
    }

    // Check account status
    if ((user as any).status === 'PENDING') {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đang chờ phê duyệt',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản của bạn đang chờ Ban biên tập phê duyệt. Vui lòng kiên nhẫn chờ đợi.', 403)
    }

    if ((user as any).status === 'REJECTED') {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đã bị từ chối',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản của bạn đã bị từ chối. Vui lòng liên hệ Ban biên tập để biết thêm chi tiết.', 403)
    }

    if (!user.isActive) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Tài khoản đã bị tạm khóa',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.', 403)
    }

    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      await auditLogger.logFailure(
        AuditEventType.LOGIN_FAILED,
        'Mật khẩu không đúng',
        {
          userId: user.id,
          userEmail: email,
          userRole: user.role,
          ...requestInfo
        }
      )
      return errorResponse('Email hoặc mật khẩu không đúng', 401)
    }

    // ✅ Tạo cả access token và refresh token
    const tokenPayload = {
      uid: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    }

    const accessToken = signToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

    // Audit log successful login
    await auditLogger.logSuccess(
      AuditEventType.LOGIN_SUCCESS,
      {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ...requestInfo,
        details: { org: user.org }
      }
    )

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role
      }
    }, 'Đăng nhập thành công')

    // ✅ Set cookies với security options
    const cookieOptions = getSecureCookieOptions()

    response.cookies.set('auth-token', accessToken, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 // 8 hours
    })

    response.cookies.set('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('❌ Login error:', error)
    
    await auditLogger.logFailure(
      AuditEventType.LOGIN_FAILED,
      'Server error',
      {
        ...requestInfo,
        details: { error: String(error) }
      }
    )
    
    return errorResponse('Lỗi server')
  }
}

