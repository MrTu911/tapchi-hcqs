
/**
 * Deadline Manager
 * Quản lý deadline cho từng giai đoạn của submission
 */

import { PrismaClient, DeadlineType, SubmissionStatus } from '@prisma/client'
import { createNotification } from './notification-manager'

const prisma = new PrismaClient()

/**
 * Tạo deadline cho submission
 */
export async function createDeadline(
  submissionId: string,
  type: DeadlineType,
  dueDate: Date,
  assignedTo?: string,
  note?: string
): Promise<void> {
  await prisma.deadline.create({
    data: {
      submissionId,
      type,
      dueDate,
      assignedTo,
      note
    }
  })
  
  // Gửi thông báo cho người được giao
  if (assignedTo) {
    await createNotification({
      userId: assignedTo,
      type: 'DEADLINE_APPROACHING',
      title: 'Nhiệm vụ mới được giao',
      message: `Bạn có một deadline ${getDeadlineTypeName(type)} cần hoàn thành trước ${dueDate.toLocaleDateString('vi-VN')}`,
      link: `/dashboard/submissions/${submissionId}`,
      sendEmail: true
    })
  }
}

/**
 * Cập nhật deadline khi hoàn thành
 */
export async function completeDeadline(deadlineId: string): Promise<void> {
  await prisma.deadline.update({
    where: { id: deadlineId },
    data: {
      completedAt: new Date()
    }
  })
}

/**
 * Kiểm tra và đánh dấu deadlines quá hạn
 */
export async function checkOverdueDeadlines(): Promise<void> {
  const now = new Date()
  
  const overdueDeadlines = await prisma.deadline.findMany({
    where: {
      dueDate: {
        lt: now
      },
      completedAt: null,
      isOverdue: false
    },
    include: {
      submission: true,
      assignedUser: true
    }
  })
  
  for (const deadline of overdueDeadlines) {
    // Đánh dấu overdue
    await prisma.deadline.update({
      where: { id: deadline.id },
      data: { isOverdue: true }
    })
    
    // Gửi thông báo
    if (deadline.assignedTo) {
      await createNotification({
        userId: deadline.assignedTo,
        type: 'DEADLINE_OVERDUE',
        title: '⚠️ Deadline đã quá hạn',
        message: `Deadline ${getDeadlineTypeName(deadline.type)} cho bài "${deadline.submission.title}" đã quá hạn`,
        link: `/dashboard/submissions/${deadline.submissionId}`,
        sendEmail: true
      })
    }
  }
}

/**
 * Gửi reminder cho deadlines sắp đến hạn
 */
export async function sendDeadlineReminders(): Promise<void> {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  
  const upcomingDeadlines = await prisma.deadline.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: threeDaysLater
      },
      completedAt: null,
      remindersSent: {
        lt: 2 // Chỉ gửi tối đa 2 lần
      }
    },
    include: {
      submission: true,
      assignedUser: true
    }
  })
  
  for (const deadline of upcomingDeadlines) {
    const daysLeft = Math.floor(
      (deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (deadline.assignedTo) {
      await createNotification({
        userId: deadline.assignedTo,
        type: 'DEADLINE_APPROACHING',
        title: '🔔 Nhắc nhở deadline',
        message: `Còn ${daysLeft} ngày để hoàn thành ${getDeadlineTypeName(deadline.type)} cho bài "${deadline.submission.title}"`,
        link: `/dashboard/submissions/${deadline.submissionId}`,
        sendEmail: true
      })
      
      // Cập nhật số lần gửi reminder
      await prisma.deadline.update({
        where: { id: deadline.id },
        data: {
          remindersSent: deadline.remindersSent + 1
        }
      })
    }
  }
}

/**
 * Lấy tên tiếng Việt của deadline type
 */
function getDeadlineTypeName(type: DeadlineType): string {
  const names: Record<DeadlineType, string> = {
    INITIAL_REVIEW: 'Phản biện ban đầu',
    REVISION_SUBMIT: 'Nộp bản sửa',
    RE_REVIEW: 'Phản biện lại',
    EDITOR_DECISION: 'Quyết định biên tập',
    PRODUCTION: 'Sản xuất/Dàn trang',
    PUBLICATION: 'Xuất bản'
  }
  return names[type]
}

/**
 * Tự động tạo deadlines khi submission chuyển status
 */
export async function autoCreateDeadlinesOnStatusChange(
  submissionId: string,
  newStatus: SubmissionStatus
): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId }
  })
  
  if (!submission) return
  
  const now = new Date()
  
  switch (newStatus) {
    case 'UNDER_REVIEW':
      // Tạo deadline cho phản biện (21 ngày)
      const reviewDeadline = new Date(now)
      reviewDeadline.setDate(reviewDeadline.getDate() + 21)
      await createDeadline(
        submissionId,
        'INITIAL_REVIEW',
        reviewDeadline,
        undefined,
        'Hoàn thành phản biện'
      )
      break
      
    case 'REVISION':
      // Tạo deadline cho tác giả sửa bài (14 ngày)
      const revisionDeadline = new Date(now)
      revisionDeadline.setDate(revisionDeadline.getDate() + 14)
      await createDeadline(
        submissionId,
        'REVISION_SUBMIT',
        revisionDeadline,
        submission.createdBy,
        'Nộp bản chỉnh sửa'
      )
      break
      
    case 'IN_PRODUCTION':
      // Tạo deadline cho layout (14 ngày)
      const productionDeadline = new Date(now)
      productionDeadline.setDate(productionDeadline.getDate() + 14)
      await createDeadline(
        submissionId,
        'PRODUCTION',
        productionDeadline,
        undefined,
        'Hoàn thành dàn trang'
      )
      break
  }
}
