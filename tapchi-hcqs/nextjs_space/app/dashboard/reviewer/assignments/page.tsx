
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ReviewerAssignmentsPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

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
              email: true,
              org: true
            }
          }
        }
      }
    },
    orderBy: {
      submittedAt: 'asc'
    }
  })

  const pendingReviews = reviews.filter(r => !r.submittedAt)
  const completedReviews = reviews.filter(r => r.submittedAt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bài được gán phản biện</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý tất cả bài viết được gán cho bạn
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Chờ phản biện ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Đã hoàn thành ({completedReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bài cần phản biện</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Không có bài nào cần phản biện</p>
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
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{review.submission.title}</h4>
                            <Badge variant="outline">Vòng {review.roundNo}</Badge>
                            {daysAgo > 7 && (
                              <Badge variant="destructive">Quá hạn</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Mã: <span className="font-mono">{review.submission.code}</span> | 
                            Tác giả: {review.submission.author.fullName} | 
                            {review.submission.category?.name || 'Chưa phân loại'}
                          </p>
                          {review.submission.abstractVn && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {review.submission.abstractVn}
                            </p>
                          )}
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
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phản biện đã hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              {completedReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có phản biện nào được hoàn thành</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedReviews.map((review) => {
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
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{review.submission.title}</h4>
                            {recLabel && (
                              <Badge variant={recLabel.variant as any}>
                                {recLabel.text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Mã: <span className="font-mono">{review.submission.code}</span> | 
                            Điểm: {review.score || 'N/A'}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Hoàn thành: {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
