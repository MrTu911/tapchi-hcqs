
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export default async function EditorSubmissionsPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ['NEW', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED']
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
        orderBy: {
          decidedAt: 'desc'
        },
        take: 1
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

  const newSubmissions = submissions.filter(s => s.status === 'NEW')
  const underReview = submissions.filter(s => s.status === 'UNDER_REVIEW')
  const needsDecision = submissions.filter(s => 
    s.status === 'UNDER_REVIEW' && 
    s.reviews.length > 0 && 
    s.reviews.every(r => r.submittedAt)
  )
  const revision = submissions.filter(s => s.status === 'REVISION')
  const accepted = submissions.filter(s => s.status === 'ACCEPTED')

  const SubmissionsList = ({ items }: { items: typeof submissions }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Không có bài nộp nào</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {items.map((submission) => {
          const status = getStatusLabel(submission.status)
          const completedReviews = submission.reviews.filter(r => r.submittedAt).length
          const totalReviews = submission.reviews.length

          return (
            <div 
              key={submission.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-lg">{submission.title}</h4>
                    <Badge variant={status.variant as any}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mã: <strong>{submission.code}</strong> | 
                    Tác giả: {submission.author.fullName} | 
                    {submission.category?.name || 'Chưa phân loại'}
                  </p>
                  {submission.abstractVn && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.abstractVn}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/editor/submissions/${submission.id}`}>
                      Chi tiết
                    </Link>
                  </Button>
                  {submission.status === 'NEW' && (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                        Gán phản biện
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                <span>
                  Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                </span>
                {totalReviews > 0 && (
                  <span>
                    Phản biện: {completedReviews}/{totalReviews}
                  </span>
                )}
                {submission.decisions.length > 0 && (
                  <span>
                    Quyết định: {submission.decisions[0].decision}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài nộp</h1>
          <p className="text-muted-foreground mt-1">
            Xem xét và quản lý các bài nộp
          </p>
        </div>
      </div>

      <Tabs defaultValue="new" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new">
            Mới ({newSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="review">
            Đang phản biện ({underReview.length})
          </TabsTrigger>
          <TabsTrigger value="decision">
            Cần quyết định ({needsDecision.length})
          </TabsTrigger>
          <TabsTrigger value="revision">
            Chỉnh sửa ({revision.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Chấp nhận ({accepted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Bài nộp mới</CardTitle>
              <CardDescription>
                Các bài viết vừa nộp, cần xem xét và gán phản biện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsList items={newSubmissions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Đang phản biện</CardTitle>
              <CardDescription>
                Các bài viết đang trong quá trình phản biện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsList items={underReview} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision">
          <Card>
            <CardHeader>
              <CardTitle>Cần quyết định</CardTitle>
              <CardDescription>
                Các bài viết đã hoàn thành phản biện, cần đưa ra quyết định
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsList items={needsDecision} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revision">
          <Card>
            <CardHeader>
              <CardTitle>Cần chỉnh sửa</CardTitle>
              <CardDescription>
                Các bài viết cần tác giả chỉnh sửa theo góp ý
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsList items={revision} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted">
          <Card>
            <CardHeader>
              <CardTitle>Đã chấp nhận</CardTitle>
              <CardDescription>
                Các bài viết đã được chấp nhận xuất bản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionsList items={accepted} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
