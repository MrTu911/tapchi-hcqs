
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import NotificationList from '@/components/dashboard/notification-list'

export default async function AuthorNotificationsPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.uid
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Group notifications by type
  const decisionNotifications = notifications.filter(n => 
    n.type === 'DECISION_MADE' || n.type === 'REVISION_REQUESTED'
  )

  const reviewNotifications = notifications.filter(n => 
    n.type === 'REVIEW_COMPLETED'
  )

  const generalNotifications = notifications.filter(n => 
    n.type === 'SUBMISSION_RECEIVED' || n.type === 'ARTICLE_PUBLISHED'
  )

  const deadlineNotifications = notifications.filter(n => 
    n.type === 'DEADLINE_APPROACHING' || n.type === 'DEADLINE_OVERDUE'
  )

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
      'REVIEW_COMPLETED': 'Phản biện',
      'DECISION_MADE': 'Quyết định',
      'REVISION_REQUESTED': 'Cần sửa',
      'ARTICLE_PUBLISHED': 'Xuất bản',
      'DEADLINE_APPROACHING': 'Hạn chót',
      'DEADLINE_OVERDUE': 'Quá hạn'
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Thông báo
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? (
              <>
                Bạn có <strong>{unreadCount}</strong> thông báo chưa đọc
              </>
            ) : (
              'Bạn đã đọc tất cả thông báo'
            )}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/author">
            Về Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Quyết định
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{decisionNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {decisionNotifications.filter(n => !n.isRead).length} chưa đọc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-600" />
              Phản biện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {reviewNotifications.filter(n => !n.isRead).length} chưa đọc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Bài viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {generalNotifications.filter(n => !n.isRead).length} chưa đọc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Hạn chót
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deadlineNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {deadlineNotifications.filter(n => !n.isRead).length} chưa đọc
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có thông báo</h3>
              <p>Bạn sẽ nhận được thông báo về các bài nộp tại đây</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tất cả thông báo</CardTitle>
            <CardDescription>
              Hiển thị {notifications.length} thông báo gần nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationList notifications={notifications} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
