
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Upload, X, FileText } from 'lucide-react'
import Image from 'next/image'

interface Issue {
  id: string
  volumeNo: number
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  pdfUrl?: string
  doi?: string
  publishDate?: string
  status: 'DRAFT' | 'PUBLISHED'
  volume?: {
    volumeNo: number
  }
}

interface IssueFormProps {
  issue?: Issue | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function IssueForm({ issue, onSuccess, onCancel }: IssueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(issue?.coverImage || null)

  // Form field states
  const [volumeNo, setVolumeNo] = useState<string>(issue?.volumeNo?.toString() || '1')
  const [number, setNumber] = useState<string>(issue?.number?.toString() || '1')
  const [year, setYear] = useState<string>(issue?.year?.toString() || new Date().getFullYear().toString())
  const [title, setTitle] = useState<string>(issue?.title || '')
  const [description, setDescription] = useState<string>(issue?.description || '')
  const [doi, setDoi] = useState<string>(issue?.doi || '')
  const [publishDate, setPublishDate] = useState<string>(
    issue?.publishDate ? new Date(issue.publishDate).toISOString().split('T')[0] : ''
  )
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(issue?.status || 'DRAFT')

  // Handle cover image selection
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Loại file không hợp lệ. Chỉ chấp nhận JPEG, PNG, JPG và WebP.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh vượt quá giới hạn 5MB')
      return
    }

    setCoverImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    toast.success('Đã chọn ảnh bìa')
  }

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImageFile(null)
    setPreviewUrl(null)
    toast.info('Đã xóa ảnh bìa')
  }

  // Handle PDF selection
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Loại file không hợp lệ. Chỉ chấp nhận PDF.')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Kích thước PDF vượt quá giới hạn 50MB')
      return
    }

    setPdfFile(file)
    toast.success('Đã chọn file PDF')
  }

  // Remove PDF
  const handleRemovePdf = () => {
    setPdfFile(null)
    toast.info('Đã xóa file PDF')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!volumeNo || !number || !year) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setIsSubmitting(true)
    try {
      const url = issue ? `/api/issues/${issue.id}` : '/api/issues'
      const method = issue ? 'PUT' : 'POST'

      // Create FormData
      const formData = new FormData()
      formData.append('volumeNo', volumeNo)
      formData.append('number', number)
      formData.append('year', year)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('doi', doi)
      formData.append('publishDate', publishDate)
      formData.append('status', status)

      // Append files if selected
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile)
      }
      if (pdfFile) {
        formData.append('pdfFile', pdfFile)
      }

      const response = await fetch(url, {
        method,
        body: formData // No Content-Type header - browser will set it automatically with boundary
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(issue ? 'Cập nhật số tạp chí thành công!' : 'Tạo số tạp chí mới thành công!')
        onSuccess?.()
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Volume Number, Issue Number and Year */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="volumeNo">
            Tập (Volume) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="volumeNo"
            type="number"
            min="1"
            value={volumeNo}
            onChange={(e) => setVolumeNo(e.target.value)}
            placeholder="1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">
            Số (Issue Number) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="number"
            type="number"
            min="1"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">
            Năm <span className="text-destructive">*</span>
          </Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Số Xuân 2025, Số Chuyên đề Công nghệ..."
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Mô tả ngắn về nội dung số này..."
        />
      </div>

      {/* Cover Image Upload */}
      <div className="space-y-2">
        <Label>Ảnh bìa (JPEG, PNG, WebP - Tối đa 5MB)</Label>
        
        {/* Preview image */}
        {previewUrl && (
          <div className="relative w-full aspect-[3/4] max-w-sm border rounded-lg overflow-hidden bg-muted">
            <Image
              src={previewUrl}
              alt="Cover preview"
              fill
              className="object-cover"
              sizes="(max-width: 384px) 100vw, 384px"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveCoverImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('cover-image-input')?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {coverImageFile ? 'Đã chọn: ' + coverImageFile.name : (previewUrl ? 'Thay đổi ảnh bìa' : 'Chọn ảnh bìa')}
        </Button>
        <input
          id="cover-image-input"
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          className="hidden"
          onChange={handleCoverImageChange}
        />
        <p className="text-xs text-muted-foreground">
          Upload ảnh bìa cho số tạp chí. Kích thước đề nghị: 800x1200px
        </p>
      </div>

      {/* PDF Upload */}
      <div className="space-y-2">
        <Label>File PDF toàn số (Tối đa 50MB)</Label>
        
        {/* Display selected PDF */}
        {pdfFile && (
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
            <div className="flex-1 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemovePdf}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('pdf-file-input')?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {pdfFile ? 'Thay đổi file PDF' : 'Chọn file PDF'}
        </Button>
        <input
          id="pdf-file-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfChange}
        />
        <p className="text-xs text-muted-foreground">
          Upload file PDF toàn văn của số tạp chí
        </p>
      </div>

      {/* DOI */}
      <div className="space-y-2">
        <Label htmlFor="doi">DOI (nếu có)</Label>
        <Input
          id="doi"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          placeholder="10.xxxxx/xxxxx"
        />
      </div>

      {/* Publish Date */}
      <div className="space-y-2">
        <Label htmlFor="publishDate">Ngày Phát hành</Label>
        <Input
          id="publishDate"
          type="date"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select
          value={status}
          onValueChange={(value: 'DRAFT' | 'PUBLISHED') => setStatus(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Nháp</SelectItem>
            <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Đang xử lý...' : issue ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  )
}
