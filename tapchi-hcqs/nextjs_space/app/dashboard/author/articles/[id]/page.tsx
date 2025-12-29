
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, FileText, Calendar, User, Tag, 
  Download, Edit3, Eye, Clock, CheckCircle, 
  MessageSquare, Loader2, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [article, setArticle] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/author/articles/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data)
      } else {
        toast.error('Không tìm thấy bài viết')
        router.push('/dashboard/author/articles')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Đã xảy ra lỗi khi tải bài viết')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; color: string }> = {
      'NEW': { label: 'Bản nháp', variant: 'secondary', color: 'bg-slate-500' },
      'UNDER_REVIEW': { label: 'Đang phản biện', variant: 'default', color: 'bg-yellow-500' },
      'REVISION': { label: 'Cần chỉnh sửa', variant: 'outline', color: 'bg-orange-500' },
      'ACCEPTED': { label: 'Đã chấp nhận', variant: 'success', color: 'bg-green-500' },
      'REJECTED': { label: 'Từ chối', variant: 'destructive', color: 'bg-red-500' },
      'DESK_REJECT': { label: 'Từ chối sơ bộ', variant: 'destructive', color: 'bg-red-600' },
      'IN_PRODUCTION': { label: 'Đang xuất bản', variant: 'secondary', color: 'bg-purple-500' },
      'PUBLISHED': { label: 'Đã xuất bản', variant: 'default', color: 'bg-blue-500' }
    }
    return statusMap[status] || { label: status, variant: 'default', color: 'bg-gray-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Không tìm thấy bài viết</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/author/articles">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(article.status)
  const canEdit = ['NEW', 'REVISION'].includes(article.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/author/articles">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chi tiết bài viết</h1>
            <p className="text-sm text-muted-foreground">Mã bài: {article.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/author/editor/${article.id}`}>
                <Edit3 className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Link>
            </Button>
          )}
          {article.manuscriptFile && (
            <Button asChild>
              <a href={article.manuscriptFile} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Tải PDF
              </a>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Article Info */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-2xl">{article.title}</CardTitle>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Tóm tắt</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.abstract || 'Chưa có tóm tắt'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Chuyên mục:</span>
                  <span>{article.category?.name || 'Chưa phân loại'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Nộp ngày:</span>
                  <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Cập nhật:</span>
                  <span>{new Date(article.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Tác giả:</span>
                  <span>{article.createdByUser?.fullName}</span>
                </div>
              </div>

              {article.keywords && article.keywords.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Từ khóa</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          {article.reviews && article.reviews.length > 0 && (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Phản biện ({article.reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {article.reviews.map((review: any) => (
                  <div key={review.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        Phản biện #{review.roundNo || 1} - [Ẩn danh theo nguyên tắc phản biện kín]
                      </span>
                      {review.recommendation && (
                        <Badge variant={review.recommendation === 'ACCEPT' ? 'success' : review.recommendation === 'REJECT' ? 'destructive' : 'secondary'}>
                          {review.recommendation === 'ACCEPT' ? 'Chấp nhận' : review.recommendation === 'REJECT' ? 'Từ chối' : review.recommendation === 'MINOR' ? 'Sửa nhỏ' : review.recommendation === 'MAJOR' ? 'Sửa lớn' : review.recommendation}
                        </Badge>
                      )}
                    </div>
                    {review.formJson && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded text-sm">
                        <p className="font-medium mb-1">Nhận xét:</p>
                        <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(review.formJson, null, 2)}
                        </pre>
                      </div>
                    )}
                    {review.submittedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Hoàn thành: {new Date(review.submittedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Decisions */}
          {article.decisions && article.decisions.length > 0 && (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Quyết định biên tập
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {article.decisions.map((decision: any) => (
                  <div key={decision.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {decision.editor?.fullName}
                      </span>
                      <Badge>{decision.decision}</Badge>
                    </div>
                    {decision.comments && (
                      <p className="text-sm text-muted-foreground">
                        {decision.comments}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(decision.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Status Timeline */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${statusInfo.color} text-white`}>
                  <p className="font-semibold text-lg">{statusInfo.label}</p>
                  <p className="text-sm opacity-90 mt-1">
                    {article.status === 'NEW' && 'Bài viết đang ở dạng nháp'}
                    {article.status === 'UNDER_REVIEW' && 'Đang được phản biện bởi các chuyên gia'}
                    {article.status === 'REVISION' && 'Cần chỉnh sửa theo yêu cầu của phản biện'}
                    {article.status === 'ACCEPTED' && 'Bài viết đã được chấp nhận xuất bản'}
                    {article.status === 'REJECTED' && 'Bài viết không đáp ứng yêu cầu xuất bản'}
                    {article.status === 'IN_PRODUCTION' && 'Đang trong quá trình biên tập và xuất bản'}
                    {article.status === 'PUBLISHED' && 'Bài viết đã được xuất bản công khai'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Tài liệu đính kèm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {article.manuscriptFile && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={article.manuscriptFile} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Bản thảo chính
                  </a>
                </Button>
              )}
              {article.coverLetterFile && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={article.coverLetterFile} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Thư giới thiệu
                  </a>
                </Button>
              )}
              {article.supplementaryFiles && article.supplementaryFiles.length > 0 && (
                article.supplementaryFiles.map((file: string, index: number) => (
                  <Button key={index} variant="outline" className="w-full justify-start" asChild>
                    <a href={file} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Tài liệu phụ {index + 1}
                    </a>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEdit && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/dashboard/author/editor/${article.id}`}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Chỉnh sửa bài viết
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/author/articles">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại danh sách
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
