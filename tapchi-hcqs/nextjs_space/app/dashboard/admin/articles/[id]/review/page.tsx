
"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  id: string
  approvalStatus: string
  approvalNote?: string
  approvedBy?: string
  approvedAt?: string
  submission: {
    title: string
    code: string
  }
  approver?: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

export default function ArticleReviewPage() {
  const params = useParams()
  const router = useRouter()
  const articleId = params?.id as string
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [decision, setDecision] = useState<string>('APPROVED')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
  }, [articleId])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${articleId}/approve`)
      const data = await response.json()
      
      if (data.success) {
        setArticle(data.data)
        setNote(data.data.approvalNote || '')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Không thể tải thông tin bài báo')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitDecision = async () => {
    if (!decision) {
      toast.error('Vui lòng chọn quyết định')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/articles/${articleId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Đã cập nhật trạng thái phê duyệt')
        router.push('/dashboard/admin/articles')
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error submitting decision:', error)
      toast.error('Không thể gửi quyết định')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Đã duyệt</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Từ chối</Badge>
      case 'REVISION_REQUIRED':
        return <Badge variant="secondary"><AlertCircle className="mr-1 h-3 w-3" />Cần chỉnh sửa</Badge>
      default:
        return <Badge variant="outline">Chờ duyệt</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center py-12 text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center py-12 text-muted-foreground">Không tìm thấy bài báo</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Kiểm duyệt bài báo</h1>
        <p className="text-muted-foreground">
          Phê duyệt hoặc từ chối bài báo trước khi xuất bản
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{article.submission.title}</CardTitle>
            {getStatusBadge(article.approvalStatus)}
          </div>
          <p className="text-sm text-muted-foreground">Mã bài: {article.submission.code}</p>
        </CardHeader>
        
        <CardContent>
          {article.approver && (
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-2">Thông tin phê duyệt:</h4>
              <p className="text-sm">
                <strong>Người duyệt:</strong> {article.approver.fullName} ({article.approver.role})
              </p>
              {article.approvedAt && (
                <p className="text-sm">
                  <strong>Thời gian:</strong> {new Date(article.approvedAt).toLocaleString('vi-VN')}
                </p>
              )}
              {article.approvalNote && (
                <div className="mt-2">
                  <strong>Ghi chú:</strong>
                  <p className="text-sm mt-1">{article.approvalNote}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quyết định phê duyệt</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Chọn quyết định</Label>
            <RadioGroup value={decision} onValueChange={setDecision}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="APPROVED" id="approved" />
                <Label htmlFor="approved" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">Duyệt đăng</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Bài báo đạt yêu cầu và được xuất bản</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="REVISION_REQUIRED" id="revision" />
                <Label htmlFor="revision" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">Yêu cầu chỉnh sửa</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Bài báo cần chỉnh sửa trước khi xuất bản</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="REJECTED" id="rejected" />
                <Label htmlFor="rejected" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">Từ chối</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Bài báo không đạt yêu cầu xuất bản</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú / Lý do</Label>
            <Textarea
              id="note"
              placeholder="Nhập ghi chú hoặc lý do cho quyết định của bạn..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Ghi chú này sẽ được gửi đến tác giả
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmitDecision}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
