
"use client"

import { useState } from 'react'
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Maximize2, Download, Eye, Loader2 } from 'lucide-react'

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

interface PDFViewerEnhancedProps {
  fileUrl: string
  title?: string
  className?: string
}

export function PDFViewerEnhanced({ fileUrl, title, className = '' }: PDFViewerEnhancedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
    toolbarPlugin: {
      fullScreenPlugin: {
        onEnterFullScreen: (zoom) => {
          zoom(SpecialZoomLevel.PageFit)
        },
      },
    },
  })

  const handleDocumentLoad = () => {
    setIsLoading(false)
  }

  const handleDocumentError = (error: any) => {
    console.error('PDF loading error:', error)
    setError('Không thể tải file PDF. Vui lòng thử lại sau.')
    setIsLoading(false)
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-700" />
            <h3 className="font-semibold text-emerald-900">
              {title || 'Xem toàn văn'}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="bg-white hover:bg-emerald-50"
            >
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Tải về
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative" style={{ minHeight: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm text-gray-600">Đang tải PDF...</p>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
            <div className="text-center p-6">
              <p className="text-red-600 mb-4">{error}</p>
              <Button asChild variant="outline">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Tải file về máy
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <Worker workerUrl="/pdf.worker.min.js">
            <div style={{ height: '600px' }}>
              <Viewer
                fileUrl={fileUrl}
                plugins={[defaultLayoutPluginInstance]}
                onDocumentLoad={handleDocumentLoad}
                defaultScale={SpecialZoomLevel.PageWidth}
                theme={{
                  theme: 'light',
                }}
              />
            </div>
          </Worker>
        )}
      </div>
    </Card>
  )
}
