
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { FileText, Calendar, Tag, User } from 'lucide-react'
import { notFound } from 'next/navigation'
import ReviewForm from '@/components/dashboard/review-form'
import { PDFViewerClient } from './pdf-viewer-client'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ReviewPage({ params }: PageProps) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const review = await prisma.review.findUnique({
    where: {
      id: params.id
    },
    include: {
      submission: {
        include: {
          category: true,
          // ❌ Không bao gồm thông tin author để đảm bảo double-blind review
          files: {
            orderBy: {
              createdAt: 'desc'
            }
          },
          versions: {
            orderBy: {
              versionNo: 'desc'
            },
            take: 1
          }
        }
      },
      reviewer: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  })

  if (!review) {
    notFound()
  }

  // Check if user is the assigned reviewer
  if (review.reviewerId !== session.uid && session.role !== 'SYSADMIN' && session.role !== 'EIC') {
    redirect('/dashboard/reviewer')
  }

  const submission = review.submission

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phản biện bài viết</h1>
          <p className="text-muted-foreground mt-1">
            Vòng {review.roundNo} - {review.submittedAt ? 'Đã hoàn thành' : 'Đang thực hiện'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/reviewer">
            Quay lại dashboard
          </Link>
        </Button>
      </div>

      {/* Submission Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{submission.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Nộp: {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              [Ẩn danh theo nguyên tắc phản biện kín]
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          {submission.category && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Chuyên mục:</span>
              <Badge>{submission.category.name}</Badge>
            </div>
          )}

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nội dung bài báo
          </CardTitle>
          <CardDescription>
            Xem toàn văn bản thảo để thực hiện phản biện
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submission.files && submission.files.length > 0 ? (
            <div className="space-y-6">
              {submission.files
                .filter((file) => file.mimeType?.includes('pdf'))
                .map((file) => (
                  <PDFViewerClient 
                    key={file.id}
                    fileId={file.id}
                    fileName={file.originalName}
                  />
                ))}
              {submission.files.filter((file) => file.mimeType?.includes('pdf')).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Không có file PDF
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Bài báo này chưa có file PDF nào được tải lên. Vui lòng liên hệ với biên tập viên.
                  </p>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <p className="font-mono">Các file có sẵn: {submission.files.map(f => f.originalName).join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Chưa có tài liệu đính kèm
              </h3>
              <p className="text-sm text-gray-500 max-w-md">
                Bài báo này chưa có file nào được tải lên. Vui lòng liên hệ với biên tập viên để được hỗ trợ.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu mẫu phản biện</CardTitle>
          <CardDescription>
            {review.submittedAt 
              ? `Đã hoàn thành vào ${new Date(review.submittedAt).toLocaleDateString('vi-VN')}`
              : 'Vui lòng điền đầy đủ thông tin phản biện'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewForm review={review} isReadOnly={!!review.submittedAt} />
        </CardContent>
      </Card>

      {/* Review Guidelines */}
      {!review.submittedAt && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Hướng dẫn phản biện</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Tính mới và độc đáo:</strong> Bài viết có đóng góp mới cho lĩnh vực không?</p>
            <p>• <strong>Phương pháp nghiên cứu:</strong> Phương pháp có phù hợp và chặt chẽ không?</p>
            <p>• <strong>Kết quả và phân tích:</strong> Kết quả có rõ ràng, chính xác không?</p>
            <p>• <strong>Trình bày:</strong> Bài viết có cấu trúc tốt, dễ hiểu không?</p>
            <p>• <strong>Tài liệu tham khảo:</strong> Trích dẫn có đầy đủ và phù hợp không?</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
