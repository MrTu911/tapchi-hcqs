
/**
 * ✅ SECURITY MONITORING & INTRUSION DETECTION
 * Real-time security monitoring and threat detection
 */

import { prisma } from './prisma'
import { auditLogger, AuditEventType } from './audit-logger'

// Thresholds for suspicious activity
const THRESHOLDS = {
  FAILED_LOGIN_ATTEMPTS: 5, // Failed logins within window
  FAILED_LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  
  API_REQUESTS_PER_MINUTE: 100,
  
  PASSWORD_CHANGES_PER_DAY: 3,
  
  SUSPICIOUS_IP_CHANGES: 5, // Different IPs within window
  IP_CHANGE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  
  FILE_UPLOADS_PER_HOUR: 50
}

/**
 * Security alert levels
 */
export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

/**
 * Security alert
 */
export interface SecurityAlert {
  level: AlertLevel
  type: string
  message: string
  userId?: string
  ipAddress?: string
  details?: any
  timestamp: Date
}

/**
 * Check for brute force login attempts
 */
export async function checkBruteForce(
  identifier: string, // email or IP
  type: 'email' | 'ip'
): Promise<{ blocked: boolean; attempts: number }> {
  const windowStart = new Date(Date.now() - THRESHOLDS.FAILED_LOGIN_WINDOW_MS)
  
  let attempts: number
  
  if (type === 'email') {
    attempts = await prisma.auditLog.count({
      where: {
        action: AuditEventType.LOGIN_FAILED,
        before: {
          path: ['userEmail'],
          equals: identifier
        },
        createdAt: {
          gte: windowStart
        }
      }
    })
  } else {
    attempts = await prisma.auditLog.count({
      where: {
        action: AuditEventType.LOGIN_FAILED,
        ipAddress: identifier,
        createdAt: {
          gte: windowStart
        }
      }
    })
  }
  
  const blocked = attempts >= THRESHOLDS.FAILED_LOGIN_ATTEMPTS
  
  if (blocked) {
    await createSecurityAlert({
      level: AlertLevel.CRITICAL,
      type: 'BRUTE_FORCE',
      message: `Phát hiện tấn công brute force từ ${type}: ${identifier}`,
      ipAddress: type === 'ip' ? identifier : undefined,
      details: { attempts, threshold: THRESHOLDS.FAILED_LOGIN_ATTEMPTS },
      timestamp: new Date()
    })
  }
  
  return { blocked, attempts }
}

/**
 * Check for suspicious IP changes
 */
export async function checkSuspiciousIpChanges(
  userId: string
): Promise<{ suspicious: boolean; uniqueIps: number }> {
  const windowStart = new Date(Date.now() - THRESHOLDS.IP_CHANGE_WINDOW_MS)
  
  const logs = await prisma.auditLog.findMany({
    where: {
      actorId: userId,
      action: AuditEventType.LOGIN_SUCCESS,
      createdAt: {
        gte: windowStart
      }
    },
    select: {
      ipAddress: true
    }
  })
  
  const uniqueIps = new Set(logs.map(log => log.ipAddress).filter(Boolean))
  const suspicious = uniqueIps.size >= THRESHOLDS.SUSPICIOUS_IP_CHANGES
  
  if (suspicious) {
    await createSecurityAlert({
      level: AlertLevel.WARNING,
      type: 'SUSPICIOUS_IP_CHANGES',
      message: `User ${userId} đăng nhập từ ${uniqueIps.size} IP khác nhau trong 1 giờ`,
      userId,
      details: { uniqueIps: Array.from(uniqueIps), threshold: THRESHOLDS.SUSPICIOUS_IP_CHANGES },
      timestamp: new Date()
    })
  }
  
  return { suspicious, uniqueIps: uniqueIps.size }
}

/**
 * Check for excessive password changes
 */
export async function checkExcessivePasswordChanges(
  userId: string
): Promise<{ excessive: boolean; changes: number }> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const changes = await prisma.auditLog.count({
    where: {
      actorId: userId,
      action: AuditEventType.PASSWORD_CHANGED,
      createdAt: {
        gte: oneDayAgo
      }
    }
  })
  
  const excessive = changes >= THRESHOLDS.PASSWORD_CHANGES_PER_DAY
  
  if (excessive) {
    await createSecurityAlert({
      level: AlertLevel.WARNING,
      type: 'EXCESSIVE_PASSWORD_CHANGES',
      message: `User ${userId} đổi mật khẩu ${changes} lần trong 24 giờ`,
      userId,
      details: { changes, threshold: THRESHOLDS.PASSWORD_CHANGES_PER_DAY },
      timestamp: new Date()
    })
  }
  
  return { excessive, changes }
}

/**
 * Check for SQL injection attempts
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;|\||&|`)/,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('|").*(\bOR\b|\bAND\b).*('|")/i
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for XSS attempts
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /data:text\/html/gi,
    /<img[^>]+src[^>]*>/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for path traversal attempts
 */
export function detectPathTraversal(input: string): boolean {
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%252e%252e%252f/i,
    /\.\.%2f/i,
    /\.\.%5c/i
  ]
  
  return pathTraversalPatterns.some(pattern => pattern.test(input))
}

/**
 * Analyze request for potential attacks
 */
export async function analyzeRequest(
  url: string,
  headers: Headers,
  body?: any,
  ipAddress?: string
): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = []
  
  // Check URL for path traversal
  if (detectPathTraversal(url)) {
    alerts.push({
      level: AlertLevel.CRITICAL,
      type: 'PATH_TRAVERSAL_ATTEMPT',
      message: 'Phát hiện thử nghiệm path traversal',
      ipAddress,
      details: { url },
      timestamp: new Date()
    })
  }
  
  // Check body for SQL injection
  if (body) {
    const bodyString = JSON.stringify(body)
    if (detectSqlInjection(bodyString)) {
      alerts.push({
        level: AlertLevel.CRITICAL,
        type: 'SQL_INJECTION_ATTEMPT',
        message: 'Phát hiện thử nghiệm SQL injection',
        ipAddress,
        details: { body },
        timestamp: new Date()
      })
    }
    
    // Check body for XSS
    if (detectXss(bodyString)) {
      alerts.push({
        level: AlertLevel.CRITICAL,
        type: 'XSS_ATTEMPT',
        message: 'Phát hiện thử nghiệm XSS',
        ipAddress,
        details: { body },
        timestamp: new Date()
      })
    }
  }
  
  // Check suspicious headers
  const userAgent = headers.get('user-agent')
  if (!userAgent || userAgent.length < 10) {
    alerts.push({
      level: AlertLevel.INFO,
      type: 'SUSPICIOUS_USER_AGENT',
      message: 'User agent đáng ngờ',
      ipAddress,
      details: { userAgent },
      timestamp: new Date()
    })
  }
  
  // Log all critical alerts
  for (const alert of alerts) {
    if (alert.level === AlertLevel.CRITICAL) {
      await auditLogger.logFailure(
        AuditEventType.ACCESS_DENIED,
        alert.message,
        {
          ipAddress: alert.ipAddress,
          details: alert.details
        }
      )
    }
  }
  
  return alerts
}

/**
 * Create security alert
 */
async function createSecurityAlert(alert: SecurityAlert): Promise<void> {
  // Log to audit system
  await auditLogger.logFailure(
    AuditEventType.PERMISSION_DENIED,
    alert.message,
    {
      userId: alert.userId,
      ipAddress: alert.ipAddress,
      details: alert.details
    }
  )
  
  // In production, you might want to:
  // - Send email notifications
  // - Send Slack/Teams alerts
  // - Trigger automated responses (e.g., temporary IP bans)
  console.error(`🚨 [SECURITY ALERT - ${alert.level}] ${alert.type}: ${alert.message}`, alert.details)
}

/**
 * Get recent security alerts
 */
export async function getRecentAlerts(
  limit: number = 50
): Promise<SecurityAlert[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: AuditEventType.ACCESS_DENIED },
        { action: AuditEventType.PERMISSION_DENIED },
        { action: AuditEventType.LOGIN_FAILED }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  })
  
  return logs.map(log => ({
    level: log.action === AuditEventType.LOGIN_FAILED ? AlertLevel.WARNING : AlertLevel.CRITICAL,
    type: log.action,
    message: log.object || 'Security event',
    userId: log.actorId || undefined,
    ipAddress: log.ipAddress || undefined,
    details: log.after,
    timestamp: log.createdAt
  }))
}
