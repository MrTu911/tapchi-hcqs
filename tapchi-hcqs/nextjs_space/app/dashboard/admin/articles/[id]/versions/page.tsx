
"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, ArrowLeft, Clock, User } from 'lucide-react'
import { format } from 'date-fns'

interface ArticleVersion {
  id: string
  version: number
  title: string
  titleEn?: string
  abstract?: string
  abstractEn?: string
  pdfUrl?: string
  pdfFile?: string
  note?: string
  createdAt: string
  submitter: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

export default function ArticleVersionsPage() {
  const params = useParams()
  const router = useRouter()
  const articleId = params?.id as string
  
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (articleId) {
      fetchVersions()
    }
  }, [articleId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/articles/${articleId}/versions`)
      const data = await response.json()
      
      if (data.success) {
        setVersions(data.data)
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = (version: ArticleVersion) => {
    if (version.pdfUrl) {
      window.open(version.pdfUrl, '_blank')
    } else if (version.pdfFile) {
      window.open(`/api/files/download?path=${encodeURIComponent(version.pdfFile)}`, '_blank')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Lịch sử phiên bản bài báo</h1>
        <p className="text-muted-foreground">
          Xem tất cả các phiên bản đã nộp của bài báo
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : versions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có phiên bản nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      v{version.version}
                    </Badge>
                    <CardTitle className="text-xl">{version.title}</CardTitle>
                  </div>
                  {(version.pdfUrl || version.pdfFile) && (
                    <Button
                      onClick={() => handleDownloadPdf(version)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Tải PDF
                    </Button>
                  )}
                </div>
                {version.titleEn && (
                  <p className="text-sm text-muted-foreground mt-2">{version.titleEn}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {version.abstract && (
                    <div>
                      <h4 className="font-semibold mb-2">Tóm tắt:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {version.abstract}
                      </p>
                    </div>
                  )}
                  
                  {version.note && (
                    <div>
                      <h4 className="font-semibold mb-2">Ghi chú:</h4>
                      <p className="text-sm text-muted-foreground">
                        {version.note}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{version.submitter.fullName}</span>
                      <Badge variant="outline" className="ml-2">
                        {version.submitter.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(version.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
