
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  Send, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Download,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  pageNumber: number
  content: string
  author: string
  createdAt: string
}

interface PDFViewerWithFeedbackProps {
  pdfUrl: string
  submissionId: string
  canComment?: boolean
  currentUser?: {
    id: string
    fullName: string
  }
}

export function PDFViewerWithFeedback({ 
  pdfUrl, 
  submissionId, 
  canComment = false,
  currentUser
}: PDFViewerWithFeedbackProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedPage, setSelectedPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [showComments, setShowComments] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [submissionId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageNumber: selectedPage,
          content: newComment,
        })
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.data])
        setNewComment('')
        toast.success('Đã thêm nhận xét')
      } else {
        toast.error('Không thể thêm nhận xét')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const pageComments = comments.filter(c => c.pageNumber === selectedPage)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
      {/* PDF Viewer */}
      <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPage(prev => Math.max(1, prev - 1))}
              disabled={selectedPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3">
              Trang {selectedPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPage(prev => Math.min(totalPages, prev + 1))}
              disabled={selectedPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.max(50, prev - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.min(200, prev + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1" />
                Tải về
              </a>
            </Button>
          </div>
        </div>

        {/* PDF Display */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg">
            <iframe
              src={`${pdfUrl}#page=${selectedPage}`}
              className="w-full h-full min-h-[600px]"
              title="PDF Viewer"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            />
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      <div className="flex flex-col border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Nhận xét</h3>
            <Badge variant="secondary">{pageComments.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {showComments && (
          <>
            {/* Comments List */}
            <ScrollArea className="flex-1 p-4">
              {pageComments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chưa có nhận xét cho trang này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageComments.map((comment) => (
                    <Card key={comment.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <Badge variant="outline" className="text-xs">
                            Trang {comment.pageNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {comment.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add Comment Form */}
            {canComment && currentUser && (
              <div className="p-4 border-t bg-gray-50 dark:bg-gray-800">
                <div className="space-y-3">
                  <Textarea
                    placeholder={`Thêm nhận xét cho trang ${selectedPage}...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Đang gửi...' : 'Gửi nhận xét'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
