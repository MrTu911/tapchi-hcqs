
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Upload, Loader2 } from 'lucide-react'

export default function SubmissionForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    abstractVn: '',
    abstractEn: '',
    keywords: '',
    section: '',
    categoryId: '',
    securityLevel: 'OPEN',
    file: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('abstractVn', formData.abstractVn)
      formDataToSend.append('abstractEn', formData.abstractEn)
      formDataToSend.append('keywords', formData.keywords)
      formDataToSend.append('section', formData.section)
      formDataToSend.append('categoryId', formData.categoryId)
      formDataToSend.append('securityLevel', formData.securityLevel)
      
      if (formData.file) {
        formDataToSend.append('file', formData.file)
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Có lỗi xảy ra khi nộp bài')
      }

      const result = await response.json()
      toast.success('Nộp bài thành công!')
      router.push(`/dashboard/author/submissions/${result.id}`)
    } catch (error) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề bài viết *</Label>
        <Input
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nhập tiêu đề bài viết"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="section">Mục</Label>
          <Input
            id="section"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="Ví dụ: Nghiên cứu khoa học"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityLevel">Mức độ bảo mật</Label>
          <Select
            value={formData.securityLevel}
            onValueChange={(value) => setFormData({ ...formData, securityLevel: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Công khai</SelectItem>
              <SelectItem value="INTERNAL">Nội bộ</SelectItem>
              <SelectItem value="SENSITIVE">Nhạy cảm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstractVn">Tóm tắt (Tiếng Việt) *</Label>
        <Textarea
          id="abstractVn"
          required
          value={formData.abstractVn}
          onChange={(e) => setFormData({ ...formData, abstractVn: e.target.value })}
          placeholder="Nhập tóm tắt bài viết bằng tiếng Việt"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstractEn">Tóm tắt (Tiếng Anh)</Label>
        <Textarea
          id="abstractEn"
          value={formData.abstractEn}
          onChange={(e) => setFormData({ ...formData, abstractEn: e.target.value })}
          placeholder="Enter abstract in English"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">Từ khóa *</Label>
        <Input
          id="keywords"
          required
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          placeholder="Nhập từ khóa, ngăn cách bởi dấu phẩy"
        />
        <p className="text-xs text-muted-foreground">
          Ví dụ: hậu cần quân sự, khoa học công nghệ, quốc phòng
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File bản thảo *</Label>
        <div className="flex items-center gap-4">
          <Input
            id="file"
            type="file"
            required
            onChange={(e) => setFormData({ 
              ...formData, 
              file: e.target.files?.[0] || null 
            })}
            accept=".pdf,.doc,.docx"
            className="flex-1"
          />
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Chấp nhận file PDF, DOC, DOCX. Dung lượng tối đa 10MB
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Nộp bài
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
