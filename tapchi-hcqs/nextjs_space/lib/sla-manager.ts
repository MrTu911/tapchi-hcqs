
/**
 * SLA (Service Level Agreement) Manager
 * Quản lý deadline và cảnh báo tiến độ
 */

import { SubmissionStatus } from '@prisma/client'

// Số ngày tiêu chuẩn cho mỗi giai đoạn
export const SLA_DAYS: Record<SubmissionStatus, number> = {
  NEW: 7,                  // 7 ngày kiểm tra sơ bộ
  DESK_REJECT: 0,          // Terminal state
  UNDER_REVIEW: 21,        // 21 ngày phản biện
  REVISION: 14,            // 14 ngày tác giả sửa bài
  ACCEPTED: 7,             // 7 ngày chuẩn bị xuất bản
  REJECTED: 0,             // Terminal state
  IN_PRODUCTION: 14,       // 14 ngày dàn trang
  PUBLISHED: 0             // Terminal state
}

export type SLAStatus = 'on-time' | 'warning' | 'overdue'

/**
 * Tính toán SLA status dựa trên deadline
 */
export function calculateSLAStatus(
  deadline: Date | null | undefined,
  completedAt: Date | null | undefined
): SLAStatus {
  if (!deadline) return 'on-time'
  
  const now = new Date()
  const targetDate = completedAt || now
  
  const daysUntilDeadline = Math.floor(
    (deadline.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilDeadline < 0) return 'overdue'
  if (daysUntilDeadline <= 3) return 'warning'
  return 'on-time'
}

/**
 * Tính ngày deadline dựa trên status hiện tại
 */
export function calculateDeadline(
  status: SubmissionStatus,
  startDate: Date = new Date()
): Date {
  const days = SLA_DAYS[status]
  const deadline = new Date(startDate)
  deadline.setDate(deadline.getDate() + days)
  return deadline
}

/**
 * Lấy màu hiển thị cho SLA status
 */
export function getSLAColor(status: SLAStatus): string {
  switch (status) {
    case 'on-time':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-300'
  }
}

/**
 * Lấy icon cho SLA status
 */
export function getSLAIcon(status: SLAStatus): string {
  switch (status) {
    case 'on-time':
      return '🟢'
    case 'warning':
      return '🟡'
    case 'overdue':
      return '🔴'
  }
}

/**
 * Tính số ngày đã ở trạng thái hiện tại
 */
export function calculateDaysInStatus(lastStatusChangeAt: Date): number {
  const now = new Date()
  const diff = now.getTime() - lastStatusChangeAt.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Kiểm tra có cần gửi reminder không
 */
export function shouldSendReminder(
  deadline: Date,
  remindersSent: number,
  maxReminders: number = 3
): boolean {
  if (remindersSent >= maxReminders) return false
  
  const now = new Date()
  const daysUntilDeadline = Math.floor(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Gửi reminder khi còn 7, 3, 1 ngày
  const reminderDays = [7, 3, 1]
  return reminderDays[remindersSent] === daysUntilDeadline
}
