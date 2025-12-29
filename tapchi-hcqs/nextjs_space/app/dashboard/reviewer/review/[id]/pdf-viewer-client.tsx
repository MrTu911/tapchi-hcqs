
'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { PDFViewerSimple } from '@/components/pdf-viewer-simple'
import { toast } from 'sonner'

interface PDFViewerClientProps {
  fileId: string
  fileName: string
}

/**
 * PDF Viewer for Author Dashboard
 * Fetches file URL from API and displays using simple iframe-based viewer
 */
export function PDFViewerClient({ fileId, fileName }: PDFViewerClientProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFileUrl = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/files/${fileId}`)
        
        if (!response.ok) {
          throw new Error('Không thể tải file')
        }

        const data = await response.json()
        
        if (data?.file?.downloadUrl) {
          setFileUrl(data.file.downloadUrl)
        } else {
          throw new Error('URL file không hợp lệ')
        }
      } catch (err) {
        console.error('Error fetching file:', err)
        setError('Không thể tải file PDF. Vui lòng thử lại sau.')
        toast.error('Không thể tải file PDF')
      } finally {
        setIsLoading(false)
      }
    }

    if (fileId) {
      fetchFileUrl()
    }
  }, [fileId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-gray-600">Đang tải PDF...</p>
      </div>
    )
  }

  if (error || !fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error || 'Không thể tải file'}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 🔒 Security Warning Watermark */}
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-bold text-red-900 text-lg">
              ⚠️ TÀI LIỆU TUYỆT MẬT - PHẢN BIỆN KHOA HỌC
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• <strong>Cấm sao chép, phát tán</strong> tài liệu này dưới mọi hình thức</li>
              <li>• Tài liệu chỉ dùng cho mục đích <strong>phản biện khoa học</strong></li>
              <li>• Thông tin tác giả đã được <strong>ẩn danh theo nguyên tắc double-blind</strong></li>
              <li>• Mọi hành vi vi phạm sẽ bị <strong>ghi lại và xử lý nghiêm khắc</strong></li>
              <li>• Link xem có hiệu lực <strong>15 phút</strong> và được <strong>ghi log truy cập</strong></li>
            </ul>
          </div>
        </div>
      </div>
      
      <PDFViewerSimple
        fileUrl={fileUrl}
        fileName={fileName}
        title="📄 Xem bản thảo (Tài liệu bảo mật)"
        height="700px"
      />
    </div>
  )
}
