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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

interface NotificationPanelProps {
  onCountChange?: (count: number) => void;
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
  SUBMISSION_RECEIVED: 'text-blue-500',
  REVIEW_INVITED: 'text-purple-500',
  REVIEW_REMINDER: 'text-orange-500',
  REVIEW_COMPLETED: 'text-green-500',
  DECISION_MADE: 'text-indigo-500',
  REVISION_REQUESTED: 'text-yellow-600',
  ARTICLE_PUBLISHED: 'text-emerald-500',
  DEADLINE_APPROACHING: 'text-orange-500',
  DEADLINE_OVERDUE: 'text-red-500',
};

export function NotificationPanel({ onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=20');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        if (onCountChange) {
          onCountChange(result.data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        if (onCountChange) {
          const unreadCount = notifications.filter(n => !n.isRead && n.id !== notificationId).length;
          onCountChange(unreadCount);
        }
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
        if (onCountChange) {
          onCountChange(0);
        }
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">({unreadCount} chưa đọc)</span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingRead}
            className="h-8 text-xs"
          >
            {markingRead ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <CheckCheck className="mr-1 h-3 w-3" />
                Đánh dấu đã đọc
              </>
            )}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const iconColor = notificationColors[notification.type] || 'text-gray-500';

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent transition-colors cursor-pointer',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.link ? (
                    <Link href={notification.link} className="flex gap-3">
                      <NotificationContent
                        Icon={Icon}
                        iconColor={iconColor}
                        notification={notification}
                      />
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      <NotificationContent
                        Icon={Icon}
                        iconColor={iconColor}
                        notification={notification}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                Xem tất cả thông báo
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationContent({
  Icon,
  iconColor,
  notification
}: {
  Icon: any;
  iconColor: string;
  notification: Notification;
}) {
  return (
    <>
      <div className={cn('flex-shrink-0 mt-1', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium line-clamp-2',
            !notification.isRead && 'font-semibold'
          )}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: vi
          })}
        </p>
      </div>
    </>
  );
}
