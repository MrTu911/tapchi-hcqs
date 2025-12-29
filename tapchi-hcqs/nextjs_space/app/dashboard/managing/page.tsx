
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/stat-card'
import { BookOpen, FileText, CheckCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ManagingEditorDashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const [
    totalIssues,
    acceptedArticles,
    inProduction,
    publishedThisYear
  ] = await Promise.all([
    prisma.issue.count(),
    prisma.submission.count({ where: { status: 'ACCEPTED' } }),
    prisma.submission.count({ where: { status: 'IN_PRODUCTION' } }),
    prisma.article.count({
      where: {
        publishedAt: {
          gte: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    })
  ])

  const recentIssues = await prisma.issue.findMany({
    take: 5,
    include: {
      volume: true,
      _count: {
        select: {
          articles: true
        }
      }
    },
    orderBy: {
      publishDate: 'desc'
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Thư ký tòa soạn</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý số tạp chí và xuất bản
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Số tạp chí"
          value={totalIssues}
          icon={BookOpen}
          description="Tổng số đã tạo"
        />
        <StatCard
          title="Bài chấp nhận"
          value={acceptedArticles}
          icon={CheckCircle}
          description="Chờ xuất bản"
        />
        <StatCard
          title="Đang sản xuất"
          value={inProduction}
          icon={FileText}
          description="Đang dàn trang"
        />
        <StatCard
          title="Năm nay"
          value={publishedThisYear}
          icon={TrendingUp}
          description="Đã xuất bản"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Quản lý quy trình xuất bản</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/managing/issues/create">
              <BookOpen className="mr-2 h-4 w-4" />
              Tạo số mới
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/managing/issues">
              Xem tất cả số
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/editor/submissions?status=ACCEPTED">
              Bài chấp nhận
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent issues */}
      <Card>
        <CardHeader>
          <CardTitle>Số tạp chí gần đây</CardTitle>
          <CardDescription>5 số mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {recentIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có số tạp chí nào</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/managing/issues/create">
                  Tạo số đầu tiên
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div 
                  key={issue.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">
                      Tập {issue.volume?.volumeNo || issue.year}, Số {issue.number} ({issue.year})
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {issue._count.articles} bài viết | 
                      Trạng thái: {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                      {issue.publishDate && ` | Xuất bản: ${new Date(issue.publishDate).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/managing/issues/${issue.id}`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
