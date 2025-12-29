
/**
 * ✅ CSRF (Cross-Site Request Forgery) PROTECTION
 * Implements Double Submit Cookie Pattern
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Set CSRF token in cookie (server-side)
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  return token
}

/**
 * Get CSRF token from cookie (server-side)
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(request: NextRequest): Promise<boolean> {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(request.method)) {
    return true
  }
  
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
  
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  
  // Both tokens must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  )
}

/**
 * Middleware to check CSRF token
 */
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const isValid = await verifyCsrfToken(request)
  
  if (!isValid) {
    return new NextResponse(
      JSON.stringify({
        error: 'CSRF token validation failed',
        message: 'Yêu cầu không hợp lệ. Vui lòng tải lại trang và thử lại.'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
  
  return null
}

/**
 * API Route helper to get CSRF token for client
 */
export async function handleCsrfTokenRequest(): Promise<Response> {
  const token = await setCsrfToken()
  
  return new Response(
    JSON.stringify({ token }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
