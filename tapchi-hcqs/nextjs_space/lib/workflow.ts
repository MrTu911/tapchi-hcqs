
/**
 * Workflow Automation Helpers
 * Quản lý quy trình tự động chuyển trạng thái submission
 */

import { SubmissionStatus, Recommendation } from '@prisma/client'

/**
 * Workflow states và transitions được phép
 */
export const WORKFLOW_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  NEW: ['DESK_REJECT', 'UNDER_REVIEW'],
  DESK_REJECT: [], // Terminal state
  UNDER_REVIEW: ['REVISION', 'ACCEPTED', 'REJECTED'],
  REVISION: ['UNDER_REVIEW', 'REJECTED'],
  ACCEPTED: ['IN_PRODUCTION'],
  REJECTED: [], // Terminal state
  IN_PRODUCTION: ['PUBLISHED'],
  PUBLISHED: [] // Terminal state
}

/**
 * Kiểm tra xem transition có hợp lệ không
 */
export function isValidTransition(
  currentStatus: SubmissionStatus,
  nextStatus: SubmissionStatus
): boolean {
  const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(nextStatus)
}

/**
 * Tự động quyết định trạng thái tiếp theo dựa trên reviews
 */
export function autoDecideNextStatus(
  reviews: Array<{ recommendation: Recommendation | null }>
): SubmissionStatus | null {
  if (reviews.length === 0) return null

  const recommendations = reviews
    .filter(r => r.recommendation !== null)
    .map(r => r.recommendation!)

  if (recommendations.length === 0) return null

  // Count recommendations
  const counts = {
    ACCEPT: recommendations.filter(r => r === 'ACCEPT').length,
    MINOR: recommendations.filter(r => r === 'MINOR').length,
    MAJOR: recommendations.filter(r => r === 'MAJOR').length,
    REJECT: recommendations.filter(r => r === 'REJECT').length
  }

  // Decision logic
  // Nếu có 2+ REJECT → REJECTED
  if (counts.REJECT >= 2) return 'REJECTED'
  
  // Nếu có 2+ MAJOR → REVISION
  if (counts.MAJOR >= 2) return 'REVISION'
  
  // Nếu có 2+ MINOR → REVISION (minor)
  if (counts.MINOR >= 2) return 'REVISION'
  
  // Nếu có 2+ ACCEPT → ACCEPTED
  if (counts.ACCEPT >= 2) return 'ACCEPTED'

  // Mixed results → cần editor quyết định
  return null
}

/**
 * Workflow notification messages
 */
export const WORKFLOW_MESSAGES: Record<SubmissionStatus, string> = {
  NEW: 'Bài viết mới được nộp',
  DESK_REJECT: 'Bài viết bị từ chối ngay (desk reject)',
  UNDER_REVIEW: 'Bài viết đang được phản biện',
  REVISION: 'Bài viết cần chỉnh sửa',
  ACCEPTED: 'Bài viết được chấp nhận',
  REJECTED: 'Bài viết bị từ chối',
  IN_PRODUCTION: 'Bài viết đang trong quá trình xuất bản',
  PUBLISHED: 'Bài viết đã được xuất bản'
}

/**
 * Get workflow status color
 */
export function getStatusColor(status: SubmissionStatus): string {
  const colors: Record<SubmissionStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    DESK_REJECT: 'bg-red-100 text-red-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    REVISION: 'bg-orange-100 text-orange-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    IN_PRODUCTION: 'bg-purple-100 text-purple-800',
    PUBLISHED: 'bg-emerald-100 text-emerald-800'
  }
  return colors[status]
}

/**
 * Get next possible actions for a submission
 */
export function getAvailableActions(
  status: SubmissionStatus,
  userRole: string
): Array<{ action: string; label: string; status: SubmissionStatus }> {
  const actions: Array<{ action: string; label: string; status: SubmissionStatus }> = []

  const nextStatuses = WORKFLOW_TRANSITIONS[status]

  for (const nextStatus of nextStatuses) {
    switch (nextStatus) {
      case 'DESK_REJECT':
        if (['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'desk_reject', label: 'Từ chối ngay', status: nextStatus })
        }
        break
      case 'UNDER_REVIEW':
        if (['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'send_to_review', label: 'Gửi phản biện', status: nextStatus })
        }
        break
      case 'REVISION':
        if (['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'request_revision', label: 'Yêu cầu chỉnh sửa', status: nextStatus })
        }
        break
      case 'ACCEPTED':
        if (['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'accept', label: 'Chấp nhận', status: nextStatus })
        }
        break
      case 'REJECTED':
        if (['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'reject', label: 'Từ chối', status: nextStatus })
        }
        break
      case 'IN_PRODUCTION':
        if (['LAYOUT_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'start_production', label: 'Bắt đầu sản xuất', status: nextStatus })
        }
        break
      case 'PUBLISHED':
        if (['EIC', 'SYSADMIN'].includes(userRole)) {
          actions.push({ action: 'publish', label: 'Xuất bản', status: nextStatus })
        }
        break
    }
  }

  return actions
}

/**
 * Check if reviewer workload is within limits
 */
export function isReviewerAvailable(
  currentWorkload: number,
  maxWorkload: number = 5
): boolean {
  return currentWorkload < maxWorkload
}

/**
 * Calculate reviewer workload score
 */
export function calculateWorkloadScore(reviews: any[]): number {
  // Pending reviews count more than completed ones
  const pending = reviews.filter(r => !r.submittedAt).length
  const completed = reviews.filter(r => r.submittedAt).length
  
  return (pending * 2) + completed
}
