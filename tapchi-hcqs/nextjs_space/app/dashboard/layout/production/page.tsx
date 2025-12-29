
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { FileText, Upload, Eye, Download, CheckCircle, Clock } from 'lucide-react'

interface Submission {
  id: string
  code: string
  title: string
  status: string
  author: {
    fullName: string
    email: string
    org?: string
  }
  category?: {
    name: string
  }
  article?: {
    id: string
    pages?: string
    doiLocal?: string
    issue?: {
      number: number
      volume: {
        volumeNo: number
      }
    }
  }
  files: Array<{
    id: string
    originalName: string
    fileType: string
    createdAt: string
  }>
  createdAt: string
}

export default function ProductionQueuePage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadData, setUploadData] = useState({
    fileType: 'COPYEDIT' as 'COPYEDIT' | 'PROOF' | 'FINAL_VERSION',
    description: '',
    file: null as File | null
  })

  useEffect(() => {
    fetchProduction()
  }, [])

  const fetchProduction = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/production')
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.data)
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách sản xuất')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission || !uploadData.file) return

    const formData = new FormData()
    formData.append('submissionId', selectedSubmission.id)
    formData.append('fileType', uploadData.fileType)
    formData.append('description', uploadData.description)
    formData.append('file', uploadData.file)

    try {
      const response = await fetch('/api/copyediting', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Tải file thành công')
        setIsUploadDialogOpen(false)
        setUploadData({ fileType: 'COPYEDIT', description: '', file: null })
        fetchProduction()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi tải file')
    }
  }

  const handlePublish = async (submissionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xuất bản bài viết này?')) return

    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action: 'publish'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Xuất bản bài viết thành công')
        fetchProduction()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi xuất bản')
    }
  }

  const inProduction = submissions.filter(s => s.status === 'IN_PRODUCTION')
  const published = submissions.filter(s => s.status === 'PUBLISHED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧩 Hàng đợi Sản xuất</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý bài viết trong giai đoạn biên tập và sản xuất
        </p>
      </div>

      <Tabs defaultValue="in_production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="in_production">
            Đang sản xuất ({inProduction.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Đã xuất bản ({published.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in_production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bài viết đang sản xuất</CardTitle>
              <CardDescription>
                Các bài viết đang trong quá trình biên tập và dàn trang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Đang tải...</p>
              ) : inProduction.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Không có bài viết nào đang sản xuất
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã bài</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Tác giả</TableHead>
                      <TableHead>Số tạp chí</TableHead>
                      <TableHead>Trang</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inProduction.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.code}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {submission.title}
                        </TableCell>
                        <TableCell>{submission.author.fullName}</TableCell>
                        <TableCell>
                          {submission.article?.issue ? (
                            <span>
                              Tập {submission.article.issue.volume.volumeNo}, Số{' '}
                              {submission.article.issue.number}
                            </span>
                          ) : (
                            <Badge variant="outline">Chưa phân công</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.article?.pages || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {submission.files.length} files
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                setIsUploadDialogOpen(true)
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Tải file
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePublish(submission.id)}
                              disabled={!submission.article?.issue}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Xuất bản
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bài viết đã xuất bản</CardTitle>
              <CardDescription>
                Các bài viết đã được xuất bản công khai
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Đang tải...</p>
              ) : published.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Chưa có bài viết nào được xuất bản
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã bài</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Tác giả</TableHead>
                      <TableHead>Số tạp chí</TableHead>
                      <TableHead>DOI</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {published.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.code}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {submission.title}
                        </TableCell>
                        <TableCell>{submission.author.fullName}</TableCell>
                        <TableCell>
                          {submission.article?.issue ? (
                            <span>
                              Tập {submission.article.issue.volume.volumeNo}, Số{' '}
                              {submission.article.issue.number}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.article?.doiLocal || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(`/articles/${submission.id}`, '_blank')
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Xem
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload File Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải file biên tập</DialogTitle>
            <DialogDescription>
              Tải lên bản biên tập hoặc bản in thử cho bài viết:{' '}
              <strong>{selectedSubmission?.code}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadFile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileType">Loại file *</Label>
              <Select
                value={uploadData.fileType}
                onValueChange={(value: any) =>
                  setUploadData({ ...uploadData, fileType: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COPYEDIT">Bản biên tập</SelectItem>
                  <SelectItem value="PROOF">Bản in thử</SelectItem>
                  <SelectItem value="FINAL_VERSION">Phiên bản cuối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={uploadData.description}
                onChange={(e) =>
                  setUploadData({ ...uploadData, description: e.target.value })
                }
                placeholder="Ghi chú về file này..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Chọn file *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    file: e.target.files?.[0] || null
                  })
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={!uploadData.file}>
                Tải lên
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
