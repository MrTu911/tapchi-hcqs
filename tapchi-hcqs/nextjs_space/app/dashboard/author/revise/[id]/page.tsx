
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { AlertCircle, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import RevisionSubmissionForm from '@/components/dashboard/revision-submission-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReviseSubmissionPage({ params }: PageProps) {
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
          fullName: true,
          email: true
        }
      },
      reviews: {
        where: {
          submittedAt: {
            not: null
          }
        },
        include: {
          reviewer: {
            select: {
              fullName: true
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

  // Check authorization
  if (submission.createdBy !== session.uid) {
    redirect('/dashboard/author')
  }

  // Check if revision is required
  if (submission.status !== 'REVISION') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nộp bản chỉnh sửa</h1>
          <p className="text-muted-foreground mt-1">
            Mã bài: <strong>{submission.code}</strong>
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bài viết này không yêu cầu chỉnh sửa. Trạng thái hiện tại: <strong>{submission.status}</strong>
          </AlertDescription>
        </Alert>

        <Button variant="outline" asChild>
          <Link href="/dashboard/author/submissions">
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    )
  }

  const latestDecision = submission.decisions[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nộp bản chỉnh sửa</h1>
          <p className="text-muted-foreground mt-1">
            Mã bài: <strong>{submission.code}</strong>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/author/submissions/${params.id}`}>
            Xem chi tiết bài gốc
          </Link>
        </Button>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{submission.title}</CardTitle>
              <CardDescription className="mt-2">
                Chuyên mục: {submission.category?.name || 'Chưa phân loại'}
              </CardDescription>
            </div>
            <Badge variant="outline">Cần chỉnh sửa</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Latest Decision */}
      {latestDecision && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <MessageSquare className="h-5 w-5" />
              Yêu cầu chỉnh sửa từ Biên tập viên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Biên tập viên: {latestDecision.editor.fullName}
              </p>
              <p className="text-amber-700">
                Vòng: {latestDecision.roundNo} | 
                Quyết định: {latestDecision.decision === 'MINOR' ? 'Sửa nhỏ' : 'Sửa lớn'}
              </p>
            </div>
            {latestDecision.note && (
              <div className="p-3 bg-white rounded border border-amber-200">
                <p className="text-sm font-medium text-amber-900 mb-2">Ghi chú của biên tập viên:</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{latestDecision.note}</p>
              </div>
            )}
            <p className="text-xs text-amber-700">
              {new Date(latestDecision.decidedAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Comments */}
      {submission.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nhận xét từ phản biện ({submission.reviews.length})
            </CardTitle>
            <CardDescription>
              Tham khảo các nhận xét sau để hoàn thiện bài viết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.reviews.map((review, index) => {
                const getRecommendationLabel = (rec: string) => {
                  const labels: Record<string, { text: string; variant: any }> = {
                    'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
                    'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
                    'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
                    'REJECT': { text: 'Từ chối', variant: 'destructive' }
                  }
                  return labels[rec] || { text: rec, variant: 'default' }
                }

                const rec = review.recommendation ? getRecommendationLabel(review.recommendation) : null

                return (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Phản biện #{index + 1} - Vòng {review.roundNo}</h5>
                        {review.score && (
                          <p className="text-sm text-muted-foreground">
                            Điểm: {review.score}/100
                          </p>
                        )}
                      </div>
                      {rec && (
                        <Badge variant={rec.variant as any}>
                          {rec.text}
                        </Badge>
                      )}
                    </div>

                    {review.formJson && (
                      <div className="mt-3 p-3 bg-muted rounded">
                        <p className="text-sm font-medium mb-2">Nhận xét chi tiết:</p>
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(review.formJson, null, 2)}
                        </pre>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Hoàn thành: {review.submittedAt && new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nộp bản chỉnh sửa
          </CardTitle>
          <CardDescription>
            Tải lên bản thảo đã chỉnh sửa và thư trả lời phản biện
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevisionSubmissionForm 
            submissionId={params.id} 
            currentVersionNo={submission.versions.length}
          />
        </CardContent>
      </Card>

      {/* Previous Versions */}
      {submission.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Các phiên bản trước</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submission.versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Phiên bản {version.versionNo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {version.changelog && (
                      <p className="text-xs text-muted-foreground mt-1">{version.changelog}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Tải xuống
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
