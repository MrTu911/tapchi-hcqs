'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const notificationIcons: Record<string, any> = {
  SUBMISSION_RECEIVED: FileText,
  REVIEW_INVITED: UserCheck,
  REVIEW_REMINDER: Clock,
  REVIEW_COMPLETED: CheckCircle,
  DECISION_MADE: AlertCircle,
  REVISION_REQUESTED: AlertCircle,
  ARTICLE_PUBLISHED: CheckCircle,
  DEADLINE_APPROACHING: Clock,
  DEADLINE_OVERDUE: AlertCircle,
};

const notificationColors: Record<string, string> = {
  SUBMISSION_RECEIVED: 'text-blue-500 bg-blue-50',
  REVIEW_INVITED: 'text-purple-500 bg-purple-50',
  REVIEW_REMINDER: 'text-orange-500 bg-orange-50',
  REVIEW_COMPLETED: 'text-green-500 bg-green-50',
  DECISION_MADE: 'text-indigo-500 bg-indigo-50',
  REVISION_REQUESTED: 'text-yellow-600 bg-yellow-50',
  ARTICLE_PUBLISHED: 'text-emerald-500 bg-emerald-50',
  DEADLINE_APPROACHING: 'text-orange-500 bg-orange-50',
  DEADLINE_OVERDUE: 'text-red-500 bg-red-50',
};

const notificationLabels: Record<string, string> = {
  SUBMISSION_RECEIVED: 'Bài viết mới',
  REVIEW_INVITED: 'Mời phản biện',
  REVIEW_REMINDER: 'Nhắc nhở phản biện',
  REVIEW_COMPLETED: 'Hoàn thành phản biện',
  DECISION_MADE: 'Quyết định',
  REVISION_REQUESTED: 'Yêu cầu sửa',
  ARTICLE_PUBLISHED: 'Đã xuất bản',
  DEADLINE_APPROACHING: 'Sắp hết hạn',
  DEADLINE_OVERDUE: 'Quá hạn',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (activeTab === 'unread') {
        params.append('unreadOnly', 'true');
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Có lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });

      const result = await response.json();

      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('Đã đánh dấu tất cả là đã đọc');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thông báo</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và xem các thông báo của bạn
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingRead}
          >
            {markingRead ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thông báo</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa đọc</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã đọc</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Tất cả
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Chưa đọc
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'unread' 
                    ? 'Bạn đã đọc tất cả thông báo' 
                    : 'Thông báo mới sẽ xuất hiện ở đây'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClasses = notificationColors[notification.type] || 'text-gray-500 bg-gray-50';
                const label = notificationLabels[notification.type] || notification.type;

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'transition-all hover:shadow-md cursor-pointer',
                      !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-6">
                      {notification.link ? (
                        <Link href={notification.link}>
                          <NotificationItem
                            Icon={Icon}
                            colorClasses={colorClasses}
                            label={label}
                            notification={notification}
                          />
                        </Link>
                      ) : (
                        <NotificationItem
                          Icon={Icon}
                          colorClasses={colorClasses}
                          label={label}
                          notification={notification}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationItem({
  Icon,
  colorClasses,
  label,
  notification
}: {
  Icon: any;
  colorClasses: string;
  label: string;
  notification: Notification;
}) {
  return (
    <div className="flex gap-4">
      <div className={cn('flex-shrink-0 p-3 rounded-full', colorClasses)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {label}
              </Badge>
              {!notification.isRead && (
                <Badge variant="default" className="text-xs">
                  Mới
                </Badge>
              )}
            </div>
            <h3 className={cn(
              'text-base font-medium',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.title}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: vi
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {notification.message}
        </p>
      </div>
    </div>
  );
}
