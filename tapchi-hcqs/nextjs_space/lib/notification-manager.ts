
/**
 * Notification Manager
 * Quản lý thông báo trong hệ thống và email
 */

import { PrismaClient, NotificationType } from '@prisma/client'
import { sendEmail } from './email'

const prisma = new PrismaClient()

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
  sendEmail?: boolean
}

/**
 * Tạo thông báo mới
 */
export async function createNotification(data: NotificationData): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      metadata: data.metadata,
      emailSent: false
    }
  })
  
  // Gửi email nếu được yêu cầu
  if (data.sendEmail !== false) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      })
      
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: data.title,
          text: data.message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              ${data.link ? `<p><a href="${data.link}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Xem chi tiết</a></p>` : ''}
              <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;" />
              <p style="color: #666; font-size: 12px;">Tạp chí Khoa học Hậu cần - Kỹ thuật Quân sự</p>
            </div>
          `
        })
        
        await prisma.notification.update({
          where: { id: notification.id },
          data: { emailSent: true }
        })
      }
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }
}

/**
 * Gửi thông báo cho nhiều người dùng
 */
export async function createBulkNotifications(
  userIds: string[],
  data: Omit<NotificationData, 'userId'>
): Promise<void> {
  await Promise.all(
    userIds.map(userId =>
      createNotification({ ...data, userId })
    )
  )
}

/**
 * Đánh dấu thông báo đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })
}

/**
 * Lấy thông báo chưa đọc của user
 */
export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      isRead: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  })
}

/**
 * Đếm số thông báo chưa đọc
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  })
}
