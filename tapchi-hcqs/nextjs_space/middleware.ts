

import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from './lib/auth-edge'
import { checkRateLimit } from './lib/rate-limiter'

/**
 * ✅ Giai đoạn 2: Rate Limiting with Redis/Memory fallback
 * Tự động dùng Redis nếu có UPSTASH_REDIS_REST_URL
 * Fallback to in-memory nếu không
 */

// Role-based dashboard mapping
const roleDashboardMap: Record<string, string> = {
  'SYSADMIN': '/dashboard/admin',
  'EIC': '/dashboard/eic',
  'MANAGING_EDITOR': '/dashboard/managing',
  'SECTION_EDITOR': '/dashboard/editor',
  'LAYOUT_EDITOR': '/dashboard/layout',
  'SECURITY_AUDITOR': '/dashboard/security',
  'REVIEWER': '/dashboard/reviewer',
  'AUTHOR': '/dashboard/author',
  'READER': '/dashboard/author'
}

// Role-based access control (EIC có full quyền admin)
const dashboardAccessControl: Record<string, string[]> = {
  '/dashboard/admin': ['SYSADMIN', 'EIC'],
  '/dashboard/eic': ['EIC', 'SYSADMIN'],
  '/dashboard/managing': ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  '/dashboard/editor': ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  '/dashboard/layout': ['LAYOUT_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  '/dashboard/security': ['SECURITY_AUDITOR', 'EIC', 'SYSADMIN'],
  '/dashboard/reviewer': ['REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  '/dashboard/author': ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'LAYOUT_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'SECURITY_AUDITOR']
}

function hasAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

function getDefaultDashboard(role: string): string {
  return roleDashboardMap[role] || '/dashboard/author'
}

/**
 * ✅ D1: Thêm Security Headers (CSP, XSS Protection)
 */
function addSecurityHeaders(response: NextResponse, pathname?: string): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com", // Allow PDF.js worker from CDN
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://cdnjs.cloudflare.com", // Allow PDF.js worker connections
    "worker-src 'self' blob:", // Allow blob workers for PDF.js
    "frame-src 'self'", // Allow iframes from same origin
    "frame-ancestors 'self'", // Allow being framed by same origin only (for PDF viewer)
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  
  // XSS Protection
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Strict Transport Security (HSTS) - chỉ ở production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '0.0.0.0'
  const method = request.method

  // ✅ Giai đoạn 2: Rate limiting với Redis support
  // Rate limit chỉ cho write operations (POST/PUT/PATCH/DELETE)
  const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  
  if (isWriteOperation) {
    const sensitiveEndpoints = [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/files/upload',
      '/api/submissions'
    ]
    
    const isSensitive = sensitiveEndpoints.some(endpoint => pathname.startsWith(endpoint))
    
    if (isSensitive) {
      const rateLimitResult = await checkRateLimit(ip, {
        maxRequests: 120, // 120 requests per window
        windowMs: 60_000, // 1 minute
        keyPrefix: 'api'
      })
      
      if (rateLimitResult.limited) {
        return new NextResponse(JSON.stringify({ 
          error: 'Too Many Requests',
          remaining: rateLimitResult.remaining,
          resetAt: rateLimitResult.resetAt
        }), { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString()
          }
        })
      }
    }
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('reason', 'no_token')
      return addSecurityHeaders(NextResponse.redirect(loginUrl), pathname)
    }

    const payload = await verifyTokenEdge(token)
    if (!payload) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('reason', 'invalid_token')
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth-token')
      return addSecurityHeaders(response, pathname)
    }

    // Role-based access control
    if (pathname.startsWith('/dashboard/')) {
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const defaultDashboard = getDefaultDashboard(payload.role)
        return addSecurityHeaders(NextResponse.redirect(new URL(defaultDashboard, request.url)), pathname)
      }

      for (const [path, allowedRoles] of Object.entries(dashboardAccessControl)) {
        if (pathname.startsWith(path)) {
          if (!hasAccess(payload.role, allowedRoles)) {
            const defaultDashboard = getDefaultDashboard(payload.role)
            const redirectUrl = new URL(defaultDashboard, request.url)
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('attempted', pathname)
            return addSecurityHeaders(NextResponse.redirect(redirectUrl), pathname)
          }
          break
        }
      }
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.uid)
    requestHeaders.set('x-user-role', payload.role)
    requestHeaders.set('x-user-email', payload.email)
    // Encode fullName using encodeURIComponent to handle Unicode characters
    requestHeaders.set('x-user-fullname', encodeURIComponent(payload.fullName))

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    return addSecurityHeaders(response, pathname)
  }

  // ✅ Thêm security headers cho tất cả response
  return addSecurityHeaders(NextResponse.next(), pathname)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*', 
    '/profile/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)', // Apply to all routes except static files
  ]
}

