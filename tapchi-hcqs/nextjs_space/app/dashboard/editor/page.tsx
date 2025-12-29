
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/stat-card'
import { FileText, Clock, CheckCircle, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function EditorDashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Get submissions that need editor attention
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ['NEW', 'UNDER_REVIEW', 'REVISION']
      }
    },
    include: {
      category: true,
      author: {
        select: {
          fullName: true,
          email: true
        }
      },
      reviews: true,
      decisions: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  })

  const stats = {
    newSubmissions: submissions.filter(s => s.status === 'NEW').length,
    underReview: submissions.filter(s => s.status === 'UNDER_REVIEW').length,
    needsDecision: submissions.filter(s => {
      return s.status === 'UNDER_REVIEW' && 
             s.reviews.some(r => r.submittedAt && !r.recommendation)
    }).length,
    thisMonth: submissions.filter(s => {
      const now = new Date()
      return new Date(s.createdAt).getMonth() === now.getMonth() &&
             new Date(s.createdAt).getFullYear() === now.getFullYear()
    }).length
  }

  const newSubmissions = submissions.filter(s => s.status === 'NEW').slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Biên tập</h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng, {session.fullName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bài mới"
          value={stats.newSubmissions}
          icon={FileText}
          description="Cần xem xét"
        />
        <StatCard
          title="Đang phản biện"
          value={stats.underReview}
          icon={Clock}
          description="Đang trong quy trình"
        />
        <StatCard
          title="Cần quyết định"
          value={stats.needsDecision}
          icon={CheckCircle}
          description="Phản biện đã hoàn thành"
        />
        <StatCard
          title="Tháng này"
          value={stats.thisMonth}
          icon={Users}
          description="Bài nộp trong tháng"
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Các hành động thường dùng</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/editor/submissions">
              Xem tất cả bài nộp
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/editor/assign-reviewers">
              Gán phản biện
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/users?role=REVIEWER">
              Danh sách phản biện
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* New submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Bài nộp mới</CardTitle>
          <CardDescription>Bài viết cần xem xét và gán phản biện</CardDescription>
        </CardHeader>
        <CardContent>
          {newSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Không có bài nộp mới</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newSubmissions.map((submission) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(submission.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <div 
                    key={submission.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{submission.title}</h4>
                        <Badge variant="default">Mới</Badge>
                        {daysAgo > 3 && (
                          <Badge variant="outline">Chờ {daysAgo} ngày</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mã bài: {submission.code} | 
                        Tác giả: {submission.author.fullName} | 
                        {submission.category?.name || 'Chưa phân loại'}
                      </p>
                      {submission.abstractVn && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {submission.abstractVn}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/editor/submissions/${submission.id}`}>
                          Xem
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                          Gán phản biện
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
