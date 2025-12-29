
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/stat-card'
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function EICDashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const [
    totalSubmissions,
    totalUsers,
    totalIssues,
    thisMonth
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.user.count(),
    prisma.issue.count({ where: { status: 'PUBLISHED' } }),
    prisma.submission.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Tổng biên tập</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan toàn hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng bài nộp"
          value={totalSubmissions}
          icon={FileText}
          description="Tất cả bài viết"
        />
        <StatCard
          title="Người dùng"
          value={totalUsers}
          icon={Users}
          description="Tất cả thành viên"
        />
        <StatCard
          title="Số đã xuất bản"
          value={totalIssues}
          icon={BookOpen}
          description="Tạp chí công khai"
        />
        <StatCard
          title="Tháng này"
          value={thisMonth}
          icon={TrendingUp}
          description="Bài nộp mới"
        />
      </div>

      {/* Quick access */}
      <Card>
        <CardHeader>
          <CardTitle>Truy cập nhanh</CardTitle>
          <CardDescription>Các chức năng quan trọng</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/editor/submissions">
              <div className="text-left">
                <div className="font-semibold">Quản lý bài nộp</div>
                <div className="text-xs text-muted-foreground">Xem và quyết định</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/managing/issues">
              <div className="text-left">
                <div className="font-semibold">Quản lý số</div>
                <div className="text-xs text-muted-foreground">Tạo và xuất bản</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/admin/users">
              <div className="text-left">
                <div className="font-semibold">Quản lý người dùng</div>
                <div className="text-xs text-muted-foreground">Phân quyền</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/admin/categories">
              <div className="text-left">
                <div className="font-semibold">Chuyên mục</div>
                <div className="text-xs text-muted-foreground">Quản lý danh mục</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/admin/statistics">
              <div className="text-left">
                <div className="font-semibold">Thống kê</div>
                <div className="text-xs text-muted-foreground">Báo cáo chi tiết</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/editor/assign-reviewers">
              <div className="text-left">
                <div className="font-semibold">Gán phản biện</div>
                <div className="text-xs text-muted-foreground">Phân công đánh giá</div>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
