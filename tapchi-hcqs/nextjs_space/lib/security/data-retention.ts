
/**
 * 🧩 DATA RETENTION POLICY MANAGER
 * Quản lý chính sách lưu trữ dữ liệu
 */

import { PrismaClient } from '@prisma/client'
import { createAuditLog } from '../audit-logger'

const prisma = new PrismaClient()

export interface RetentionPolicy {
  entity: 'SUBMISSION' | 'ARTICLE' | 'REVIEW' | 'AUDIT_LOG' | 'FILE'
  retentionYears: number
  action: 'ARCHIVE' | 'DELETE'
  enabled: boolean
}

// Chính sách mặc định
const DEFAULT_POLICIES: RetentionPolicy[] = [
  {
    entity: 'SUBMISSION',
    retentionYears: 5,
    action: 'ARCHIVE',
    enabled: true
  },
  {
    entity: 'ARTICLE',
    retentionYears: 10,
    action: 'ARCHIVE',
    enabled: true
  },
  {
    entity: 'REVIEW',
    retentionYears: 3,
    action: 'ARCHIVE',
    enabled: true
  },
  {
    entity: 'AUDIT_LOG',
    retentionYears: 2,
    action: 'DELETE',
    enabled: true
  },
  {
    entity: 'FILE',
    retentionYears: 5,
    action: 'DELETE',
    enabled: true
  }
]

/**
 * Lấy chính sách retention
 */
export async function getRetentionPolicies(): Promise<RetentionPolicy[]> {
  const policies = await prisma.retentionPolicy.findMany()
  
  if (policies.length === 0) {
    return DEFAULT_POLICIES
  }
  
  return policies.map(p => ({
    entity: p.entity as RetentionPolicy['entity'],
    retentionYears: p.retentionYears,
    action: p.action as RetentionPolicy['action'],
    enabled: p.enabled
  }))
}

/**
 * Cập nhật chính sách retention
 */
export async function updateRetentionPolicy(
  entity: RetentionPolicy['entity'],
  policy: Partial<RetentionPolicy>,
  updatedBy: string
): Promise<void> {
  await prisma.retentionPolicy.upsert({
    where: { entity },
    create: {
      entity,
      retentionYears: policy.retentionYears || 5,
      action: policy.action || 'ARCHIVE',
      enabled: policy.enabled ?? true
    },
    update: {
      retentionYears: policy.retentionYears,
      action: policy.action,
      enabled: policy.enabled,
      updatedAt: new Date()
    }
  })
  
  await createAuditLog({
    userId: updatedBy,
    action: 'UPDATE_RETENTION_POLICY',
    entity: 'SYSTEM',
    entityId: entity,
    metadata: policy
  })
}

/**
 * Áp dụng data retention cho submissions
 */
export async function applySubmissionRetention(): Promise<number> {
  const policy = await prisma.retentionPolicy.findUnique({
    where: { entity: 'SUBMISSION' }
  })
  
  if (!policy || !policy.enabled) return 0
  
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears)
  
  let affectedCount = 0
  
  if (policy.action === 'ARCHIVE') {
    // Archive submissions cũ
    const result = await prisma.submission.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { notIn: ['PUBLISHED'] }
      },
      data: {
        isArchived: true
      }
    })
    affectedCount = result.count
  } else if (policy.action === 'DELETE') {
    // Xóa submissions bị reject
    const result = await prisma.submission.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'REJECTED'
      }
    })
    affectedCount = result.count
  }
  
  await createAuditLog({
    userId: 'SYSTEM',
    action: 'DATA_RETENTION_APPLIED',
    entity: 'SUBMISSION',
    entityId: `retention_${policy.entity}`,
    metadata: {
      policy: policy.action,
      retentionYears: policy.retentionYears,
      cutoffDate,
      affectedCount
    }
  })
  
  return affectedCount
}

/**
 * Áp dụng data retention cho audit logs
 */
export async function applyAuditLogRetention(): Promise<number> {
  const policy = await prisma.retentionPolicy.findUnique({
    where: { entity: 'AUDIT_LOG' }
  })
  
  if (!policy || !policy.enabled) return 0
  
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears)
  
  // Xóa audit logs cũ (trừ security alerts)
  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      action: { not: 'SECURITY_ALERT' }
    }
  })
  
  console.log(`🧹 Deleted ${result.count} old audit logs (older than ${policy.retentionYears} years)`)
  
  return result.count
}

/**
 * Áp dụng data retention cho files
 */
export async function applyFileRetention(): Promise<number> {
  const policy = await prisma.retentionPolicy.findUnique({
    where: { entity: 'FILE' }
  })
  
  if (!policy || !policy.enabled) return 0
  
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears)
  
  // Xóa files không còn liên kết
  const orphanedFiles = await prisma.uploadedFile.findMany({
    where: {
      createdAt: { lt: cutoffDate },
      submission: null
    }
  })
  
  // TODO: Xóa file từ S3/storage trước khi xóa record
  
  const result = await prisma.uploadedFile.deleteMany({
    where: {
      id: { in: orphanedFiles.map((f: any) => f.id) }
    }
  })
  
  console.log(`🧹 Deleted ${result.count} orphaned files (older than ${policy.retentionYears} years)`)
  
  return result.count
}

/**
 * Chạy tất cả retention policies
 */
export async function runAllRetentionPolicies(): Promise<{
  submissions: number
  auditLogs: number
  files: number
}> {
  console.log('🧹 Running data retention policies...')
  
  const [submissions, auditLogs, files] = await Promise.all([
    applySubmissionRetention(),
    applyAuditLogRetention(),
    applyFileRetention()
  ])
  
  console.log(`✅ Data retention completed:`)
  console.log(`   - Submissions: ${submissions} affected`)
  console.log(`   - Audit Logs: ${auditLogs} deleted`)
  console.log(`   - Files: ${files} deleted`)
  
  return { submissions, auditLogs, files }
}

/**
 * Lấy thống kê data retention
 */
export async function getRetentionStats() {
  const policies = await getRetentionPolicies()
  
  const stats = await Promise.all(
    policies.map(async (policy) => {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears)
      
      let count = 0
      
      switch (policy.entity) {
        case 'SUBMISSION':
          count = await prisma.submission.count({
            where: {
              createdAt: { lt: cutoffDate },
              status: { notIn: ['PUBLISHED'] }
            }
          })
          break
        case 'AUDIT_LOG':
          count = await prisma.auditLog.count({
            where: {
              createdAt: { lt: cutoffDate },
              action: { not: 'SECURITY_ALERT' }
            }
          })
          break
        case 'FILE':
          count = await prisma.uploadedFile.count({
            where: {
              createdAt: { lt: cutoffDate },
              submission: null
            }
          })
          break
      }
      
      return {
        entity: policy.entity,
        retentionYears: policy.retentionYears,
        action: policy.action,
        enabled: policy.enabled,
        affectedCount: count,
        cutoffDate
      }
    })
  )
  
  return stats
}
