
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Mail,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminWorkflowPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email }
  });

  if (!user || user.role !== 'SYSADMIN') {
    redirect('/dashboard');
  }

  // Get workflow statistics
  const [
    totalSubmissions,
    activeSubmissions,
    overdueSubmissions,
    pendingReviews,
    totalDeadlines,
    overdueDeadlines,
    upcomingDeadlines
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({
      where: {
        status: {
          notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT']
        }
      }
    }),
    prisma.submission.count({
      where: {
        isOverdue: true,
        status: {
          notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT']
        }
      }
    }),
    prisma.review.count({
      where: {
        submittedAt: null,
        declinedAt: null,
        deadline: {
          gte: new Date()
        }
      }
    }),
    prisma.deadline.count({
      where: {
        completedAt: null
      }
    }),
    prisma.deadline.count({
      where: {
        isOverdue: true,
        completedAt: null
      }
    }),
    prisma.deadline.count({
      where: {
        completedAt: null,
        dueDate: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          gte: new Date()
        }
      }
    })
  ]);

  // Get recent workflow events (from audit logs)
  const recentEvents = await prisma.auditLog.findMany({
    where: {
      action: {
        startsWith: 'WORKFLOW_'
      }
    },
    include: {
      actor: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý Workflow System</h1>
        <p className="text-muted-foreground mt-1">
          Giám sát và điều khiển hệ thống workflow tự động
        </p>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Đang hoạt động / {totalSubmissions} tổng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Submissions quá SLA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phản biện</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Đang chờ phản biện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeadlines}</div>
            <p className="text-xs text-muted-foreground">
              {overdueDeadlines} quá hạn, {upcomingDeadlines} sắp tới
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác hệ thống</CardTitle>
          <CardDescription>
            Các công cụ quản lý workflow và automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Gửi Reminder Email</p>
                <p className="text-sm text-muted-foreground">
                  Gửi email nhắc nhở cho các deadline sắp tới
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/api/cron/reminders" target="_blank">
                <RefreshCw className="w-4 h-4 mr-2" />
                Chạy ngay
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Kiểm tra Overdue</p>
                <p className="text-sm text-muted-foreground">
                  Cập nhật trạng thái deadline quá hạn
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>
              <RefreshCw className="w-4 h-4 mr-2" />
              Chạy ngay
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">View All Deadlines</p>
                <p className="text-sm text-muted-foreground">
                  Xem tất cả deadline trong hệ thống
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/deadlines">
                Xem chi tiết
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workflow Events */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động workflow gần đây</CardTitle>
          <CardDescription>
            Lịch sử các hành động workflow trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Chưa có hoạt động nào
              </p>
            ) : (
              <>
                {recentEvents.map((event) => {
                  const actionLabels: Record<string, string> = {
                    WORKFLOW_SEND_TO_REVIEW: 'Gửi phản biện',
                    WORKFLOW_REQUEST_REVISION: 'Yêu cầu chỉnh sửa',
                    WORKFLOW_ACCEPT: 'Chấp nhận bài viết',
                    WORKFLOW_REJECT: 'Từ chối bài viết',
                    WORKFLOW_DESK_REJECT: 'Từ chối ngay',
                    WORKFLOW_START_PRODUCTION: 'Bắt đầu sản xuất',
                    WORKFLOW_PUBLISH: 'Xuất bản'
                  };

                  return (
                    <div
                      key={event.id.toString()}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {actionLabels[event.action] || event.action}
                          </Badge>
                          {event.actor && (
                            <span className="text-sm text-muted-foreground">
                              bởi {event.actor.fullName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.object}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
