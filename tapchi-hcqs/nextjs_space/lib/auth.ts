

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { auditLogger, AuditEventType } from './audit-logger'

export interface JWTPayload {
  uid: string
  role: string
  email: string
  fullName: string
  type?: 'access' | 'refresh' // ✅ Thêm type để phân biệt access/refresh token
  iat?: number
  exp?: number
}

// ⚠️ SECURITY: JWT_SECRET phải được cấu hình trong .env
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('❌ CRITICAL: JWT_SECRET must be set in environment variables')
  }
  return secret
}

// ✅ Refresh token secret riêng biệt (nên dùng secret khác với access token)
function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('❌ CRITICAL: JWT_REFRESH_SECRET must be set in environment variables')
  }
  return secret
}

const BCRYPT_SALT_ROUNDS = 12

/**
 * ✅ Tạo Access Token (thời gian ngắn - 8 giờ)
 */
export function signToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: 'access' }, 
    getJWTSecret(), 
    { expiresIn: '8h' }
  )
}

/**
 * ✅ Tạo Refresh Token (thời gian dài - 7 ngày)
 */
export function signRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    getRefreshSecret(),
    { expiresIn: '7d' }
  )
}

/**
 * ✅ Verify Access Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload
    
    // Kiểm tra xem đây có phải access token không
    if (decoded.type && decoded.type !== 'access') {
      return null
    }
    
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logFailure(AuditEventType.TOKEN_EXPIRED, 'Token đã hết hạn', {
        details: { expiredAt: error.expiredAt }
      })
    } else if (error.name === 'JsonWebTokenError') {
      auditLogger.logFailure(AuditEventType.TOKEN_INVALID, 'Token không hợp lệ', {
        details: { message: error.message }
      })
    }
    return null
  }
}

/**
 * ✅ Verify Refresh Token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as JWTPayload
    
    // Kiểm tra xem đây có phải refresh token không
    if (decoded.type !== 'refresh') {
      return null
    }
    
    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      auditLogger.logFailure(AuditEventType.TOKEN_EXPIRED, 'Refresh token đã hết hạn', {
        details: { expiredAt: error.expiredAt }
      })
    }
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * ✅ Cookie options với security flags
 */
export function getSecureCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    httpOnly: true,
    secure: isProduction, // Chỉ bật HTTPS ở production
    sameSite: 'lax' as const, // Bảo vệ CSRF
    path: '/',
  }
}

export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) return null
    
    return verifyToken(token)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const session = await getServerSession()
  if (!session) {
    auditLogger.logFailure(AuditEventType.ACCESS_DENIED, 'Unauthorized access attempt', {})
    throw new Error('Unauthorized')
  }
  return session
}

export async function getCurrentUser() {
  const session = await getServerSession()
  if (!session) return null

  // ✅ Chỉ lấy user còn active
  const user = await prisma.user.findUnique({
    where: { 
      id: session.uid,
      isActive: true
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      org: true,
      isActive: true,
      createdAt: true
    }
  })

  if (!user) {
    auditLogger.logFailure(
      AuditEventType.ACCESS_DENIED, 
      'User không tồn tại hoặc đã bị vô hiệu hóa',
      { userId: session.uid, userEmail: session.email }
    )
    return null
  }

  return user
}

