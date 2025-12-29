

/**
 * ✅ NÂNG CẤP: Audit Logging System - Lưu vào Database
 * Ghi lại các sự kiện bảo mật và hoạt động quan trọng
 * Tuân thủ TT41 về nhật ký hoạt động hệ thống
 */

import { prisma } from './prisma'

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILED = 'REGISTER_FAILED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  
  // Authorization events
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // Submission events
  SUBMISSION_CREATED = 'SUBMISSION_CREATED',
  SUBMISSION_UPDATED = 'SUBMISSION_UPDATED',
  SUBMISSION_DELETED = 'SUBMISSION_DELETED',
  SUBMISSION_STATUS_CHANGED = 'SUBMISSION_STATUS_CHANGED',
  
  // Review events
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  REVIEW_UPDATED = 'REVIEW_UPDATED',
  
  // Editorial events
  DECISION_MADE = 'DECISION_MADE',
  ARTICLE_PUBLISHED = 'ARTICLE_PUBLISHED',
  ARTICLE_UPDATED = 'ARTICLE_UPDATED',
  
  // Role escalation events
  ROLE_ESCALATION_REQUESTED = 'ROLE_ESCALATION_REQUESTED',
  ROLE_ESCALATION_APPROVED = 'ROLE_ESCALATION_APPROVED',
  ROLE_ESCALATION_REJECTED = 'ROLE_ESCALATION_REJECTED',
  
  ISSUE_CREATED = 'ISSUE_CREATED',
  ISSUE_PUBLISHED = 'ISSUE_PUBLISHED',
  
  // News events
  NEWS_CREATED = 'NEWS_CREATED',
  NEWS_UPDATED = 'NEWS_UPDATED',
  NEWS_DELETED = 'NEWS_DELETED',
  NEWS_PUBLISHED = 'NEWS_PUBLISHED',
  
  // File access events (for double-blind review security)
  FILE_ACCESSED = 'FILE_ACCESSED',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  FILE_DELETE = 'FILE_DELETE',
  
  // System events
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  
  // CMS events
  BANNER_CHANGED = 'BANNER_CHANGED',
  MENU_CHANGED = 'MENU_CHANGED',
  HOMEPAGE_CHANGED = 'HOMEPAGE_CHANGED',
  PAGE_CHANGED = 'PAGE_CHANGED',
  
  // Media Library events
  MEDIA_UPLOADED = 'MEDIA_UPLOADED',
  MEDIA_UPDATED = 'MEDIA_UPDATED',
  MEDIA_DELETED = 'MEDIA_DELETED',
}

export interface AuditLogEntry {
  timestamp: Date
  eventType: AuditEventType
  userId?: string
  userEmail?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  details?: any
  success: boolean
  errorMessage?: string
}

class AuditLogger {
  /**
   * ✅ Lưu audit log vào database
   */
  async logToDatabase(entry: Omit<AuditLogEntry, 'timestamp'>) {
    try {
      const logEntry: any = {
        actorId: entry.userId || null,
        action: entry.eventType,
        object: entry.success ? 'SUCCESS' : 'FAILURE',
        ipAddress: entry.ipAddress || null,
      }

      // ✅ Prisma Json fields: null cần được xử lý đặc biệt
      if (entry.details || entry.userEmail || entry.userRole || entry.userAgent) {
        logEntry.before = { 
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          userAgent: entry.userAgent,
        }
        logEntry.after = entry.details
      }

      await prisma.auditLog.create({
        data: logEntry
      })

      // Console log cho development
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔒 [AUDIT DB]', JSON.stringify({
          ...entry,
          timestamp: new Date()
        }, null, 2))
      }
    } catch (error) {
      // Nếu không lưu được vào DB, ít nhất log ra console
      console.error('❌ [AUDIT ERROR] Failed to save audit log:', error)
      console.log('🔒 [AUDIT FALLBACK]', JSON.stringify({
        ...entry,
        timestamp: new Date()
      }))
    }
  }
  
  /**
   * Log thành công
   */
  async logSuccess(eventType: AuditEventType, data: Partial<AuditLogEntry>) {
    await this.logToDatabase({
      eventType,
      success: true,
      ...data
    })
  }
  
  /**
   * Log thất bại
   */
  async logFailure(eventType: AuditEventType, errorMessage: string, data: Partial<AuditLogEntry>) {
    await this.logToDatabase({
      eventType,
      success: false,
      errorMessage,
      ...data
    })
  }

  /**
   * ✅ Helper để lấy IP và User Agent từ request
   */
  extractRequestInfo(request: Request) {
    return {
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }
  }
}

export const auditLogger = new AuditLogger()

/**
 * Simple helper for logging audit events
 */
export async function logAudit(params: {
  actorId?: string
  action: string
  object: string
  before?: any
  after?: any
  ip?: string
  ipAddress?: string // Support both for backwards compatibility
}) {
  await auditLogger.logToDatabase({
    userId: params.actorId,
    eventType: params.action as AuditEventType,
    details: {
      object: params.object,
      before: params.before,
      after: params.after
    },
    success: true,
    ipAddress: params.ipAddress || params.ip
  })
}

/**
 * ✅ Enhanced audit log function for Phase 6
 * Compatible with new AuditLog schema
 */
export async function createAuditLog(params: {
  userId?: string
  action: string
  entity: string
  entityId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  before?: any
  after?: any
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.userId || null,
        action: params.action,
        object: params.entity,
        objectId: params.entityId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        before: params.before || null,
        after: params.after || null,
        metadata: params.metadata || null
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

