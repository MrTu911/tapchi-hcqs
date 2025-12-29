
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Loader2, AlertCircle, FileText, Eye, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface PDFViewerSimpleProps {
  fileUrl: string
  fileName?: string
  title?: string
  className?: string
  height?: string
}

/**
 * Simple and reliable PDF viewer using iframe with browser's built-in PDF viewer
 * This approach avoids complex dependencies and "Failed to fetch" errors
 */
export function PDFViewerSimple({ 
  fileUrl, 
  fileName = 'document.pdf',
  title,
  className = '',
  height = '700px'
}: PDFViewerSimpleProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [useObjectTag, setUseObjectTag] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleError = () => {
    setIsLoading(false)
    if (retryCount < 1 && !useObjectTag) {
      // Try with object tag as fallback
      setUseObjectTag(true)
      setRetryCount(prev => prev + 1)
      setIsLoading(true)
    } else {
      setError('Không thể tải file PDF. Vui lòng thử tải xuống hoặc mở trong tab mới.')
    }
  }

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Đang tải xuống...')
    } catch (err) {
      toast.error('Không thể tải file')
    }
  }

  const handleOpenNewTab = () => {
    window.open(fileUrl, '_blank')
    toast.success('Đã mở PDF trong tab mới')
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-700" />
            <div>
              <CardTitle className="text-blue-900">{title || 'Xem tài liệu PDF'}</CardTitle>
              <p className="text-sm text-blue-700 mt-1">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenNewTab}
              className="bg-white hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Mở tab mới
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="bg-white hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Tải về
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-white hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              {isExpanded ? 'Thu gọn' : 'Mở rộng'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="relative" style={{ height }}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">Đang tải PDF...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
                <div className="text-center p-6">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Tải xuống
                    </Button>
                    <Button variant="outline" onClick={handleOpenNewTab}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Mở tab mới
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {useObjectTag ? (
              <object
                data={`${fileUrl}#toolbar=1`}
                type="application/pdf"
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                title={fileName}
              >
                <div className="flex flex-col items-center justify-center h-full bg-slate-100 p-8">
                  <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
                  <p className="text-gray-700 mb-4">Trình duyệt không hỗ trợ xem PDF trực tiếp</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Tải xuống
                    </Button>
                    <Button variant="outline" onClick={handleOpenNewTab}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Mở tab mới
                    </Button>
                  </div>
                </div>
              </object>
            ) : (
              <iframe
                src={`${fileUrl}#toolbar=1`}
                className="w-full h-full border-0"
                onLoad={handleLoad}
                onError={handleError}
                title={fileName}
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
