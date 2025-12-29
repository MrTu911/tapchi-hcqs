
import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeadlineCard from '@/components/dashboard/deadline-card';
import StatCard from '@/components/dashboard/stat-card';
import { Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EditorWorkflowPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email }
  });

  if (!user) {
    redirect('/auth/login');
  }

  // Get all deadlines
  const allDeadlines = await prisma.deadline.findMany({
    where: {
      submission: {
        status: {
          notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT']
        }
      }
    },
    include: {
      submission: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true
        }
      },
      assignedUser: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  // Get my deadlines
  const myDeadlines = await prisma.deadline.findMany({
    where: {
      assignedTo: user.id,
      completedAt: null
    },
    include: {
      submission: {
        select: {
          id: true,
          code: true,
          title: true,
          status: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  // Get overdue submissions
  const overdueSubmissions = await prisma.submission.findMany({
    where: {
      isOverdue: true,
      status: {
        notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT']
      }
    },
    include: {
      author: {
        select: {
          fullName: true,
          email: true
        }
      },
      category: true
    },
    orderBy: {
      lastStatusChangeAt: 'asc'
    },
    take: 10
  });

  // Calculate stats
  const stats = {
    totalActive: allDeadlines.filter(d => !d.completedAt).length,
    overdue: allDeadlines.filter(d => d.isOverdue && !d.completedAt).length,
    upcoming: allDeadlines.filter(d => {
      const dueDate = new Date(d.dueDate);
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate > now && dueDate <= threeDaysLater && !d.completedAt;
    }).length,
    completed: allDeadlines.filter(d => d.completedAt).length
  };

  const overdueDeadlines = allDeadlines.filter(d => d.isOverdue && !d.completedAt);
  const upcomingDeadlines = allDeadlines.filter(d => {
    const dueDate = new Date(d.dueDate);
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return dueDate > now && dueDate <= threeDaysLater && !d.completedAt;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Workflow</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi tiến độ và deadline của các bài viết
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Deadline đang hoạt động"
          value={stats.totalActive}
          icon={Clock}
          description="Chưa hoàn thành"
        />
        <StatCard
          title="Quá hạn"
          value={stats.overdue}
          icon={AlertTriangle}
          description="Cần xử lý ngay"
        />
        <StatCard
          title="Sắp đến hạn"
          value={stats.upcoming}
          icon={TrendingUp}
          description="Trong 3 ngày tới"
        />
        <StatCard
          title="Đã hoàn thành"
          value={stats.completed}
          icon={CheckCircle}
          description="Tổng số đã hoàn thành"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overdue">
            Quá hạn ({overdueDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Sắp đến hạn ({upcomingDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="my-deadlines">
            Của tôi ({myDeadlines.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Tất cả ({allDeadlines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="space-y-4">
          {overdueDeadlines.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Không có deadline quá hạn
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {overdueDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingDeadlines.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Không có deadline sắp đến hạn
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {upcomingDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="my-deadlines" className="space-y-4">
          {myDeadlines.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Bạn không có deadline nào
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {myDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allDeadlines.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Không có deadline nào
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {allDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Overdue Submissions */}
      {overdueSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bài viết quá hạn SLA</CardTitle>
            <CardDescription>
              Các bài viết đang quá thời gian xử lý tiêu chuẩn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/editor/submissions/${submission.id}`}
                      className="font-medium hover:underline"
                    >
                      {submission.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Mã: {submission.code} • Tác giả: {submission.author.fullName}
                    </p>
                    <p className="text-sm text-destructive">
                      Quá hạn {submission.daysInCurrentStatus} ngày ở trạng thái {submission.status}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/editor/submissions/${submission.id}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
