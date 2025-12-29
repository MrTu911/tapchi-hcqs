
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { FileText, Calendar, Tag, Shield, User, MessageSquare, CheckCircle, UserPlus, History } from 'lucide-react'
import { notFound } from 'next/navigation'
import EditorDecisionForm from '@/components/dashboard/editor-decision-form'
import WorkflowTimeline from '@/components/dashboard/workflow-timeline'
import WorkflowActions from '@/components/dashboard/workflow-actions'
import { PDFViewerClient } from './pdf-viewer-client'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditorSubmissionDetailPage({ params }: PageProps) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: params.id
    },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          fullName: true,
          email: true,
          org: true
        }
      },
      files: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
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
      },
      versions: {
        orderBy: {
          versionNo: 'desc'
        }
      }
    }
  })

  if (!submission) {
    notFound()
  }

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

  const getRecommendationLabel = (rec: string) => {
    const labels: Record<string, { text: string; variant: any }> = {
      'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
      'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
      'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
      'REJECT': { text: 'Từ chối', variant: 'destructive' }
    }
    return labels[rec] || { text: rec, variant: 'default' }
  }

  const status = getStatusLabel(submission.status)
  const completedReviews = submission.reviews.filter(r => r.submittedAt)
  const pendingReviews = submission.reviews.filter(r => !r.submittedAt)
  const allReviewsCompleted = submission.reviews.length > 0 && pendingReviews.length === 0

  // Determine current round
  const maxRound = submission.reviews.length > 0 
    ? Math.max(...submission.reviews.map(r => r.roundNo))
    : 1

  // Get current user info for workflow actions
  const currentUser = await prisma.user.findUnique({
    where: { email: session.email }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Chi tiết bài nộp</h1>
            <Badge variant={status.variant as any} className="text-sm">
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Mã bài: <strong>{submission.code}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/editor/submissions">
              Quay lại
            </Link>
          </Button>
          {submission.status === 'NEW' && (
            <Button asChild>
              <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Gán phản biện
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Actions */}
      {currentUser && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Hành động Workflow</CardTitle>
            <CardDescription>
              Các hành động có thể thực hiện với bài viết này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorkflowActions
              submissionId={submission.id}
              currentStatus={submission.status}
              userRole={currentUser.role}
            />
            <Separator />
            <div>
              <Link href={`/dashboard/submissions/${submission.id}/versions`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <History className="w-4 h-4 mr-2" />
                  Xem lịch sử phiên bản
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{submission.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {submission.author.fullName}
            </span>
            {submission.author.org && (
              <span>• {submission.author.org}</span>
            )}
            <span>• {submission.author.email}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category and Security */}
          <div className="flex flex-wrap gap-4">
            {submission.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Chuyên mục:</span>
                <Badge>{submission.category.name}</Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Bảo mật:</span>
              <Badge variant="outline">{submission.securityLevel}</Badge>
            </div>
          </div>

          <Separator />

          {/* Abstract Vietnamese */}
          {submission.abstractVn && (
            <div>
              <h4 className="font-semibold mb-2">Tóm tắt (Tiếng Việt)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractVn}</p>
            </div>
          )}

          {/* Abstract English */}
          {submission.abstractEn && (
            <div>
              <h4 className="font-semibold mb-2">Abstract (English)</h4>
              <p className="text-sm text-muted-foreground">{submission.abstractEn}</p>
            </div>
          )}

          {/* Keywords */}
          {submission.keywords && submission.keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Từ khóa</h4>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer Section */}
      {submission.files && submission.files.length > 0 && (
        <div className="space-y-4">
          {submission.files
            .filter((file) => file.fileType === 'MANUSCRIPT' && file.mimeType?.includes('pdf'))
            .map((file) => (
              <PDFViewerClient 
                key={file.id}
                fileId={file.id}
                fileName={file.originalName}
              />
            ))}
        </div>
      )}

      {/* Reviewers Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Trạng thái phản biện ({completedReviews.length}/{submission.reviews.length})
              </CardTitle>
              <CardDescription>
                Vòng {maxRound}
              </CardDescription>
            </div>
            {submission.status !== 'NEW' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cập nhật phản biện
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {submission.reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa gán phản biện viên</p>
              <Button asChild className="mt-4">
                <Link href={`/dashboard/editor/assign-reviewers?submissionId=${submission.id}`}>
                  Gán phản biện viên
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {submission.reviews.map((review, index) => {
                const rec = review.recommendation ? getRecommendationLabel(review.recommendation) : null

                return (
                  <div 
                    key={review.id}
                    className={`border rounded-lg p-4 ${review.submittedAt ? 'bg-green-50' : 'bg-amber-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Phản biện #{index + 1}</h5>
                        <p className="text-sm text-muted-foreground">
                          {review.reviewer.fullName} ({review.reviewer.email})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rec && (
                          <Badge variant={rec.variant as any}>
                            {rec.text}
                          </Badge>
                        )}
                        {review.submittedAt ? (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã hoàn thành
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Đang chờ
                          </Badge>
                        )}
                      </div>
                    </div>

                    {review.submittedAt ? (
                      <div className="space-y-2">
                        {review.score && (
                          <p className="text-sm">
                            <strong>Điểm:</strong> {review.score}/100
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Hoàn thành: {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                        </p>
                        {review.formJson && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-medium mb-2">
                              Xem chi tiết phản biện
                            </summary>
                            <div className="space-y-3 mt-3 p-3 bg-white rounded border">
                              {Object.entries(review.formJson as any).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                                    {key}
                                  </p>
                                  <p className="text-sm">{value as string}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Đang chờ phản biện hoàn thành...
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Decision Form */}
      {allReviewsCompleted && submission.status !== 'ACCEPTED' && submission.status !== 'REJECTED' && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Đưa ra quyết định biên tập</CardTitle>
            <CardDescription>
              Tất cả phản biện đã hoàn thành. Vui lòng đưa ra quyết định cho bài viết này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditorDecisionForm 
              submissionId={submission.id} 
              roundNo={maxRound}
              reviews={completedReviews}
            />
          </CardContent>
        </Card>
      )}

      {/* Previous Decisions */}
      {submission.decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Lịch sử quyết định ({submission.decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.decisions.map((decision, index) => {
                const getDecisionLabel = (dec: string) => {
                  const labels: Record<string, { text: string; variant: any }> = {
                    'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
                    'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
                    'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
                    'REJECT': { text: 'Từ chối', variant: 'destructive' }
                  }
                  return labels[dec] || { text: dec, variant: 'default' }
                }

                const decLabel = getDecisionLabel(decision.decision)

                return (
                  <div key={decision.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Quyết định vòng {decision.roundNo}</h5>
                        <p className="text-sm text-muted-foreground">
                          Biên tập: {decision.editor.fullName}
                        </p>
                      </div>
                      <Badge variant={decLabel.variant as any}>
                        {decLabel.text}
                      </Badge>
                    </div>

                    {decision.note && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-2">Ghi chú:</p>
                        <p className="text-sm">{decision.note}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(decision.decidedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline */}
      <WorkflowTimeline submissionId={submission.id} />
    </div>
  )
}
