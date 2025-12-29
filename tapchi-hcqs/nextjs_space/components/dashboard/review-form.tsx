
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface ReviewFormProps {
  review: any
  isReadOnly?: boolean
}

export default function ReviewForm({ review, isReadOnly = false }: ReviewFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const existingFormData = review.formJson || {}
  
  const [formData, setFormData] = useState({
    score: review.score || 0,
    recommendation: review.recommendation || '',
    novelty: existingFormData.novelty || '',
    methodology: existingFormData.methodology || '',
    results: existingFormData.results || '',
    presentation: existingFormData.presentation || '',
    references: existingFormData.references || '',
    strengths: existingFormData.strengths || '',
    weaknesses: existingFormData.weaknesses || '',
    comments: existingFormData.comments || '',
    confidentialComments: existingFormData.confidentialComments || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isReadOnly) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi nộp phản biện')
      }

      toast.success('Nộp phản biện thành công!')
      router.push('/dashboard/reviewer')
      router.refresh()
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Score and Recommendation */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="score">Điểm tổng thể (0-100) *</Label>
          <Input
            id="score"
            type="number"
            min="0"
            max="100"
            required
            disabled={isReadOnly}
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
            placeholder="Nhập điểm từ 0-100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendation">Khuyến nghị *</Label>
          <Select
            value={formData.recommendation}
            onValueChange={(value) => setFormData({ ...formData, recommendation: value })}
            required
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn khuyến nghị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACCEPT">Chấp nhận</SelectItem>
              <SelectItem value="MINOR">Chấp nhận với sửa đổi nhỏ</SelectItem>
              <SelectItem value="MAJOR">Yêu cầu sửa đổi lớn</SelectItem>
              <SelectItem value="REJECT">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Detailed Criteria */}
      <div className="space-y-4">
        <h4 className="font-semibold">Đánh giá chi tiết</h4>
        
        <div className="space-y-2">
          <Label htmlFor="novelty">1. Tính mới và độc đáo *</Label>
          <Textarea
            id="novelty"
            required
            disabled={isReadOnly}
            value={formData.novelty}
            onChange={(e) => setFormData({ ...formData, novelty: e.target.value })}
            placeholder="Bài viết có đóng góp gì mới cho lĩnh vực?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="methodology">2. Phương pháp nghiên cứu *</Label>
          <Textarea
            id="methodology"
            required
            disabled={isReadOnly}
            value={formData.methodology}
            onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
            placeholder="Phương pháp nghiên cứu có phù hợp và chặt chẽ không?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="results">3. Kết quả và phân tích *</Label>
          <Textarea
            id="results"
            required
            disabled={isReadOnly}
            value={formData.results}
            onChange={(e) => setFormData({ ...formData, results: e.target.value })}
            placeholder="Kết quả có rõ ràng, chính xác và đủ hỗ trợ cho kết luận không?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="presentation">4. Trình bày và cấu trúc *</Label>
          <Textarea
            id="presentation"
            required
            disabled={isReadOnly}
            value={formData.presentation}
            onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
            placeholder="Bài viết có cấu trúc tốt, dễ đọc và dễ hiểu không?"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="references">5. Tài liệu tham khảo *</Label>
          <Textarea
            id="references"
            required
            disabled={isReadOnly}
            value={formData.references}
            onChange={(e) => setFormData({ ...formData, references: e.target.value })}
            placeholder="Trích dẫn có đầy đủ, phù hợp và cập nhật không?"
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Strengths and Weaknesses */}
      <div className="space-y-4">
        <h4 className="font-semibold">Điểm mạnh và điểm yếu</h4>

        <div className="space-y-2">
          <Label htmlFor="strengths">Điểm mạnh *</Label>
          <Textarea
            id="strengths"
            required
            disabled={isReadOnly}
            value={formData.strengths}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
            placeholder="Liệt kê các điểm mạnh của bài viết"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weaknesses">Điểm yếu và đề xuất cải thiện *</Label>
          <Textarea
            id="weaknesses"
            required
            disabled={isReadOnly}
            value={formData.weaknesses}
            onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
            placeholder="Liệt kê các điểm yếu và đề xuất cách cải thiện"
            rows={4}
          />
        </div>
      </div>

      <Separator />

      {/* Comments */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Nhận xét dành cho tác giả *</Label>
          <Textarea
            id="comments"
            required
            disabled={isReadOnly}
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            placeholder="Nhận xét và góp ý dành cho tác giả"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            Nhận xét này sẽ được gửi cho tác giả
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidentialComments">Nhận xét bảo mật cho biên tập</Label>
          <Textarea
            id="confidentialComments"
            disabled={isReadOnly}
            value={formData.confidentialComments}
            onChange={(e) => setFormData({ ...formData, confidentialComments: e.target.value })}
            placeholder="Nhận xét riêng cho biên tập viên (không gửi cho tác giả)"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Nội dung này chỉ biên tập viên mới xem được
          </p>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Nộp phản biện
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Hủy
          </Button>
        </div>
      )}

      {isReadOnly && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <p className="font-medium">Phản biện đã hoàn thành</p>
          <p className="text-sm mt-1">
            Bạn đã nộp phản biện này vào {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
          </p>
        </div>
      )}
    </form>
  )
}
