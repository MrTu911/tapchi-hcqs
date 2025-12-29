
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ReviewerHistoryPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const reviews = await prisma.review.findMany({
    where: {
      reviewerId: session.uid,
      submittedAt: {
        not: null
      }
    },
    include: {
      submission: {
        include: {
          category: true,
          author: {
            select: {
              fullName: true
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  })

  const stats = {
    total: reviews.length,
    thisYear: reviews.filter(r => 
      r.submittedAt && new Date(r.submittedAt).getFullYear() === new Date().getFullYear()
    ).length,
    avgScore: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length).toFixed(1)
      : 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lịch sử phản biện</h1>
        <p className="text-muted-foreground mt-1">
          Tất cả phản biện đã hoàn thành của bạn
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phản biện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Năm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.thisYear}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Review history */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phản biện</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có phản biện nào được hoàn thành</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
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
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{review.submission.title}</h4>
                        {recLabel && (
                          <Badge variant={recLabel.variant as any}>
                            {recLabel.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mã: {review.submission.code} | 
                        Điểm: {review.score || 'N/A'} | 
                        Tác giả: {review.submission.author.fullName}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Hoàn thành: {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
