
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RevisionSubmissionFormProps {
  submissionId: string
  currentVersionNo: number
}

export default function RevisionSubmissionForm({ submissionId, currentVersionNo }: RevisionSubmissionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null)
  const [responseFile, setResponseFile] = useState<File | null>(null)
  const [changelog, setChangelog] = useState('')
  const [coverLetter, setCoverLetter] = useState('')

  const handleManuscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (!validTypes.includes(file.type)) {
        toast.error('Vui lòng tải lên file PDF, DOC hoặc DOCX')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 10MB')
        return
      }
      setManuscriptFile(file)
    }
  }

  const handleResponseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      if (!validTypes.includes(file.type)) {
        toast.error('Vui lòng tải lên file PDF, DOC hoặc DOCX')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 10MB')
        return
      }
      setResponseFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manuscriptFile) {
      toast.error('Vui lòng tải lên file bản thảo đã chỉnh sửa')
      return
    }

    if (!changelog.trim()) {
      toast.error('Vui lòng mô tả những thay đổi chính')
      return
    }

    setIsSubmitting(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('submissionId', submissionId)
      formData.append('versionNo', String(currentVersionNo + 1))
      formData.append('manuscript', manuscriptFile)
      if (responseFile) {
        formData.append('responseToReviewers', responseFile)
      }
      formData.append('changelog', changelog)
      formData.append('coverLetter', coverLetter)

      const response = await fetch('/api/submissions/revise', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Không thể nộp bản chỉnh sửa')
      }

      toast.success('Nộp bản chỉnh sửa thành công!')
      router.push(`/dashboard/author/submissions/${submissionId}`)
      router.refresh()
    } catch (error: any) {
      console.error('Revision submission error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi nộp bản chỉnh sửa')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Manuscript File */}
      <div className="space-y-2">
        <Label htmlFor="manuscript" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Bản thảo đã chỉnh sửa <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="manuscript"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleManuscriptChange}
            disabled={isSubmitting}
            className="flex-1"
          />
          {manuscriptFile && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{manuscriptFile.name}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Định dạng: PDF, DOC, DOCX | Dung lượng tối đa: 10MB
        </p>
      </div>

      {/* Response to Reviewers (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="response" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Thư trả lời phản biện (tùy chọn)
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="response"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResponseChange}
            disabled={isSubmitting}
            className="flex-1"
          />
          {responseFile && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{responseFile.name}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          File giải trình các thay đổi theo yêu cầu của phản biện viên
        </p>
      </div>

      {/* Changelog */}
      <div className="space-y-2">
        <Label htmlFor="changelog">
          Mô tả những thay đổi chính <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="changelog"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          disabled={isSubmitting}
          placeholder="Mô tả ngắn gọn những thay đổi chính trong bản chỉnh sửa này..."
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">
          Tóm tắt các nội dung đã sửa đổi theo yêu cầu
        </p>
      </div>

      {/* Cover Letter (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="coverLetter">Thư ngỏ gửi biên tập viên (tùy chọn)</Label>
        <Textarea
          id="coverLetter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          disabled={isSubmitting}
          placeholder="Thư ngỏ hoặc lời nhắn gửi biên tập viên..."
          rows={4}
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Sau khi nộp bản chỉnh sửa, bài viết sẽ được gửi lại cho biên tập viên xem xét. 
          Bạn có thể xem tiến trình xử lý trong mục "Bài nộp của tôi".
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !manuscriptFile || !changelog.trim()}
          className="min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Đang nộp...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Nộp bản chỉnh sửa
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
      </div>
    </form>
  )
}
