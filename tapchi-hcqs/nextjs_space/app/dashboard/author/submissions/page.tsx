
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export default async function AuthorSubmissionsPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const submissions = await prisma.submission.findMany({
    where: {
      createdBy: session.uid
    },
    include: {
      category: true,
      reviews: {
        include: {
          reviewer: {
            select: {
              fullName: true
            }
          }
        }
      },
      decisions: {
        include: {
          editor: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          decidedAt: 'desc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      'NEW': { label: 'Mới nộp', variant: 'default' },
      'DESK_REJECT': { label: 'Từ chối sơ bộ', variant: 'destructive' },
      'UNDER_REVIEW': { label: 'Đang phản biện', variant: 'secondary' },
      'REVISION': { label: 'Cần chỉnh sửa', variant: 'outline' },
      'ACCEPTED': { label: 'Chấp nhận', variant: 'success' },
      'REJECTED': { label: 'Từ chối', variant: 'destructive' },
      'IN_PRODUCTION': { label: 'Đang xuất bản', variant: 'secondary' },
      'PUBLISHED': { label: 'Đã xuất bản', variant: 'default' }
    }
    return statusMap[status] || { label: status, variant: 'default' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bài nộp của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả bài viết đã nộp
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/author/submit">
            <FileText className="mr-2 h-4 w-4" />
            Nộp bài mới
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có bài nộp nào</h3>
              <p className="mb-4">Bắt đầu chia sẻ nghiên cứu của bạn với cộng đồng khoa học</p>
              <Button asChild>
                <Link href="/dashboard/author/submit">
                  Nộp bài đầu tiên
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {submissions.map((submission) => {
            const status = getStatusLabel(submission.status)
            const completedReviews = submission.reviews.filter(r => r.submittedAt).length
            const latestDecision = submission.decisions[0]

            return (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{submission.title}</CardTitle>
                        <Badge variant={status.variant as any}>
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Mã bài: <strong>{submission.code}</strong> | 
                        Chuyên mục: <strong>{submission.category?.name || 'Chưa phân loại'}</strong>
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/author/submissions/${submission.id}`}>
                        Xem chi tiết
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Abstract preview */}
                    {submission.abstractVn && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.abstractVn}
                      </p>
                    )}

                    {/* Keywords */}
                    {submission.keywords && submission.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {submission.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
                      <span>
                        Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span>
                        Phản biện: {completedReviews}/{submission.reviews.length}
                      </span>
                      {latestDecision && (
                        <span>
                          Quyết định: {latestDecision.decision} ({new Date(latestDecision.decidedAt).toLocaleDateString('vi-VN')})
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
