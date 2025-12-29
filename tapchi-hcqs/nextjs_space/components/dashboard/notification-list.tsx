
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Bell, CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: Date
  metadata?: any
}

interface NotificationListProps {
  notifications: Notification[]
}

export default function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter()
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DECISION_MADE':
      case 'REVISION_REQUESTED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'REVIEW_COMPLETED':
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case 'SUBMISSION_RECEIVED':
      case 'ARTICLE_PUBLISHED':
        return <FileText className="h-5 w-5 text-purple-600" />
      case 'DEADLINE_APPROACHING':
      case 'DEADLINE_OVERDUE':
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SUBMISSION_RECEIVED': 'Bài nộp',
      'REVIEW_INVITED': 'Mời phản biện',
      'REVIEW_REMINDER': 'Nhắc phản biện',
      'REVIEW_COMPLETED': 'Phản biện',
      'DECISION_MADE': 'Quyết định',
      'REVISION_REQUESTED': 'Cần sửa',
      'ARTICLE_PUBLISHED': 'Xuất bản',
      'DEADLINE_APPROACHING': 'Hạn chót',
      'DEADLINE_OVERDUE': 'Quá hạn'
    }
    return labels[type] || type
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      router.refresh()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      toast.success('Đã đánh dấu tất cả đã đọc')
      router.refresh()
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between pb-3 border-b">
          <p className="text-sm text-muted-foreground">
            {unreadCount} thông báo chưa đọc
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isMarkingAllRead}
          >
            {isMarkingAllRead ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
              ${notification.isRead ? 'bg-background hover:bg-accent/50' : 'bg-blue-50 hover:bg-blue-100 border-blue-200'}
            `}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                {!notification.isRead && (
                  <Badge variant="default" className="text-xs">Mới</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(notification.type)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(notification.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {notification.link && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={notification.link} onClick={(e) => e.stopPropagation()}>
                  Xem
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
