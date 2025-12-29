
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/stat-card'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function ReviewerDashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Get reviewer's assignments
  const reviews = await prisma.review.findMany({
    where: {
      reviewerId: session.uid
    },
    include: {
      submission: {
        include: {
          category: true,
          author: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'asc'
    }
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => !r.submittedAt).length,
    completed: reviews.filter(r => r.submittedAt).length,
    thisMonth: reviews.filter(r => {
      const reviewDate = r.submittedAt || new Date()
      const now = new Date()
      return reviewDate.getMonth() === now.getMonth() && 
             reviewDate.getFullYear() === now.getFullYear()
    }).length
  }

  const pendingReviews = reviews.filter(r => !r.submittedAt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Phản biện</h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng, {session.fullName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng số bài"
          value={stats.total}
          icon={FileText}
          description="Tất cả bài được gán"
        />
        <StatCard
          title="Chờ phản biện"
          value={stats.pending}
          icon={Clock}
          description="Cần hoàn thành"
        />
        <StatCard
          title="Đã hoàn thành"
          value={stats.completed}
          icon={CheckCircle}
          description="Đã nộp phản biện"
        />
        <StatCard
          title="Tháng này"
          value={stats.thisMonth}
          icon={AlertCircle}
          description="Phản biện trong tháng"
        />
      </div>

      {/* Pending reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Bài cần phản biện</CardTitle>
          <CardDescription>
            Danh sách bài viết đang chờ phản biện của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
              <p>Bạn đã hoàn thành tất cả phản biện</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(review.submission.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                )
                
                return (
                  <div 
                    key={review.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{review.submission.title}</h4>
                        <Badge variant="outline">Vòng {review.roundNo}</Badge>
                        {daysAgo > 7 && (
                          <Badge variant="destructive">Quá hạn</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mã bài: {review.submission.code} | 
                        Tác giả: {review.submission.author.fullName}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Gán từ: {daysAgo} ngày trước
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/dashboard/reviewer/review/${review.id}`}>
                        Bắt đầu phản biện
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent completed reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Phản biện gần đây</CardTitle>
          <CardDescription>Các phản biện đã hoàn thành</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews
              .filter(r => r.submittedAt)
              .slice(0, 5)
              .map((review) => {
                const getRecommendationLabel = (rec: string) => {
                  const labels: Record<string, { text: string; variant: any }> = {
                    'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
                    'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
                    'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
                    'REJECT': { text: 'Từ chối', variant: 'destructive' }
                  }
                  return labels[rec] || { text: rec, variant: 'default' }
                }

                const recLabel = review.recommendation 
                  ? getRecommendationLabel(review.recommendation) 
                  : null

                return (
                  <div 
                    key={review.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{review.submission.title}</h4>
                        {recLabel && (
                          <Badge variant={recLabel.variant as any}>
                            {recLabel.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Điểm: {review.score || 'N/A'} | 
                        Hoàn thành: {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/reviewer/review/${review.id}`}>
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
