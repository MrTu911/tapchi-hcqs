
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface EditorDecisionFormProps {
  submissionId: string
  roundNo: number
  reviews: any[]
}

export default function EditorDecisionForm({ 
  submissionId, 
  roundNo,
  reviews 
}: EditorDecisionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    decision: '',
    note: ''
  })

  // Calculate review statistics
  const avgScore = reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length
  const recommendations = reviews.map(r => r.recommendation).filter(Boolean)
  
  const recommendationCounts = recommendations.reduce((acc, rec) => {
    acc[rec] = (acc[rec] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.decision) {
      toast.error('Vui lòng chọn quyết định')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/submissions/${submissionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: formData.decision,
          note: formData.note,
          roundNo
        })
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi đưa ra quyết định')
      }

      toast.success('Quyết định đã được ghi nhận!')
      router.push('/dashboard/editor/submissions')
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
      {/* Review Summary */}
      <div className="space-y-3">
        <h4 className="font-semibold">Tổng hợp đánh giá từ phản biện viên</h4>
        
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Điểm trung bình</p>
            <p className="text-2xl font-bold">{avgScore.toFixed(1)}/100</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Khuyến nghị</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(recommendationCounts).map(([rec, count]) => {
                const getLabel = (r: string) => {
                  const labels: Record<string, { text: string; variant: any }> = {
                    'ACCEPT': { text: 'Chấp nhận', variant: 'success' },
                    'MINOR': { text: 'Sửa nhỏ', variant: 'secondary' },
                    'MAJOR': { text: 'Sửa lớn', variant: 'outline' },
                    'REJECT': { text: 'Từ chối', variant: 'destructive' }
                  }
                  return labels[r] || { text: r, variant: 'default' }
                }
                const label = getLabel(rec)
                return (
                  <Badge key={rec} variant={label.variant as any}>
                    {label.text}: {String(count)}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Decision Selection */}
      <div className="space-y-2">
        <Label htmlFor="decision">Quyết định biên tập *</Label>
        <Select
          value={formData.decision}
          onValueChange={(value) => setFormData({ ...formData, decision: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn quyết định" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACCEPT">
              Chấp nhận xuất bản
            </SelectItem>
            <SelectItem value="MINOR">
              Chấp nhận với sửa đổi nhỏ
            </SelectItem>
            <SelectItem value="MAJOR">
              Yêu cầu sửa đổi lớn và phản biện lại
            </SelectItem>
            <SelectItem value="REJECT">
              Từ chối xuất bản
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Quyết định này sẽ được gửi cho tác giả
        </p>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Ghi chú cho tác giả</Label>
        <Textarea
          id="note"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Nhập ghi chú, góp ý hoặc yêu cầu cụ thể cho tác giả"
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          Ghi chú này sẽ được gửi cùng với quyết định cho tác giả
        </p>
      </div>

      {/* Decision Guidelines */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-2">
        <p className="font-medium">Hướng dẫn đưa ra quyết định:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><strong>Chấp nhận:</strong> Bài viết đạt yêu cầu, có thể xuất bản ngay</li>
          <li><strong>Sửa nhỏ:</strong> Bài viết tốt nhưng cần chỉnh sửa nhỏ về trình bày, ngôn ngữ</li>
          <li><strong>Sửa lớn:</strong> Bài viết tiềm năng nhưng cần sửa đổi lớn về nội dung, phương pháp</li>
          <li><strong>Từ chối:</strong> Bài viết không đáp ứng tiêu chuẩn xuất bản</li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Xác nhận quyết định
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.back()}
        >
          Hủy
        </Button>
      </div>
    </form>
  )
}
