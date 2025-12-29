'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  PlusCircle, 
  Eye, 
  Loader2, 
  BookOpen, 
  Calendar, 
  FileText,
  Download,
  CheckCircle,
  ExternalLink,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AddArticlesToIssueDialog } from '@/components/dashboard/add-articles-dialog'

interface Volume {
  id: string
  volumeNo: number
  year: number
  title?: string
}

interface Article {
  id: string
  title: string
  doi?: string
  publishedAt?: string
  views: number
  downloads: number
  submission?: {
    id: string
    code: string
    author: {
      id: string
      fullName: string
      org?: string
    }
    category?: {
      id: string
      name: string
      code: string
    }
    createdAt: string
  }
}

interface Issue {
  id: string
  volumeNo: number
  volume?: Volume
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  pdfUrl?: string
  doi?: string
  publishDate?: string
  status: 'DRAFT' | 'PUBLISHED'
  articles: Article[]
  _count?: {
    articles: number
  }
}

export default function IssueDetailPage() {
  const router = useRouter()
  const params = useParams()
  const issueId = params?.id as string

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  useEffect(() => {
    if (issueId) {
      fetchIssueDetail()
    }
  }, [issueId])

  const fetchIssueDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/issues/${issueId}`)
      const data = await response.json()
      
      if (response.ok && (data.success || data.issue)) {
        setIssue(data.issue || data.data)
      } else {
        toast.error(data.error || 'Không thể tải thông tin số tạp chí')
        router.push('/dashboard/admin/issues')
      }
    } catch (error) {
      console.error('Fetch issue error:', error)
      toast.error('Lỗi kết nối server')
      router.push('/dashboard/admin/issues')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!issue) return

    if (!issue.articles || issue.articles.length === 0) {
      toast.error('Không thể xuất bản số tạp chí chưa có bài viết')
      return
    }

    setPublishing(true)
    try {
      const response = await fetch('/api/issues/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue.id })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Xuất bản số tạp chí thành công!')
        fetchIssueDetail()
        router.refresh()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi xuất bản')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setPublishing(false)
      setPublishDialogOpen(false)
    }
  }

  const handleArticlesAdded = () => {
    setAddDialogOpen(false)
    fetchIssueDetail()
    router.refresh()
  }

  const handleRemoveArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: null })
      })

      if (response.ok) {
        toast.success('Đã gỡ bài viết khỏi số tạp chí')
        fetchIssueDetail()
      } else {
        toast.error('Không thể gỡ bài viết')
      }
    } catch (error) {
      console.error('Remove article error:', error)
      toast.error('Lỗi kết nối server')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải...</span>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
        <p className="text-xl text-muted-foreground">Không tìm thấy số tạp chí</p>
        <Button onClick={() => router.push('/dashboard/admin/issues')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/admin/issues')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Tập {issue.volume?.volumeNo || issue.volumeNo} - Số {issue.number} ({issue.year})
            </h1>
            <p className="text-muted-foreground mt-1">
              {issue.title || 'Chưa có tiêu đề'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/issues/${issue.id}`} target="_blank">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Xem công khai
            </Button>
          </Link>
          {issue.status === 'DRAFT' && (
            <Button
              onClick={() => setPublishDialogOpen(true)}
              disabled={!issue.articles || issue.articles.length === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Xuất bản số
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'} className="text-sm">
          {issue.status === 'PUBLISHED' ? '✓ Đã xuất bản' : '✎ Nháp'}
        </Badge>
        {issue.publishDate && (
          <span className="text-sm text-muted-foreground">
            Ngày xuất bản: {format(new Date(issue.publishDate), 'dd/MM/yyyy', { locale: vi })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Issue Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ảnh bìa</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.coverImage ? (
                <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa ${issue.title || 'số tạp chí'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-blue-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Mô tả</div>
                <p className="text-sm">{issue.description || 'Chưa có mô tả'}</p>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">DOI</div>
                <p className="text-sm font-mono">{issue.doi || 'Chưa có DOI'}</p>
              </div>
              {issue.pdfUrl && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">PDF toàn số</div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={issue.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống PDF
                      </a>
                    </Button>
                  </div>
                </>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Số bài viết</div>
                  <p className="text-2xl font-bold">{issue.articles?.length || 0}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Năm</div>
                  <p className="text-2xl font-bold">{issue.year}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Articles List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách bài báo</CardTitle>
                  <CardDescription>
                    Tổng cộng: {issue.articles?.length || 0} bài viết
                  </CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm bài báo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!issue.articles || issue.articles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground mb-4">Chưa có bài viết nào trong số này</p>
                  <Button onClick={() => setAddDialogOpen(true)} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm bài báo đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">STT</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead className="text-center">Lượt xem</TableHead>
                        <TableHead className="text-center">Lượt tải</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issue.articles.map((article, index) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <Link 
                              href={`/articles/${article.id}`}
                              target="_blank"
                              className="hover:underline font-medium"
                            >
                              {article.title}
                            </Link>
                            {article.doi && (
                              <div className="text-xs text-muted-foreground mt-1 font-mono">
                                DOI: {article.doi}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{article.submission?.author.fullName}</div>
                              {article.submission?.author.org && (
                                <div className="text-xs text-muted-foreground">
                                  {article.submission.author.org}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {article.submission?.category && (
                              <Badge variant="outline">
                                {article.submission.category.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{article.views}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span>{article.downloads}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveArticle(article.id)}
                              className="text-destructive hover:text-destructive"
                              title="Gỡ khỏi số này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Articles Dialog */}
      <AddArticlesToIssueDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        issueId={issue.id}
        onSuccess={handleArticlesAdded}
      />

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Xác nhận xuất bản số tạp chí
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xuất bản{' '}
              <strong>
                Tập {issue.volume?.volumeNo || issue.volumeNo} - Số {issue.number} ({issue.year})
              </strong>?
              <br />
              <br />
              Số này có <strong>{issue.articles?.length || 0} bài viết</strong>. 
              Sau khi xuất bản, các bài viết sẽ hiển thị công khai trên website.
              <br />
              <br />
              <span className="block mt-2 text-primary font-medium">
                ✓ Hành động này có thể hoàn tác sau bằng cách chỉnh sửa trạng thái số.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              disabled={publishing}
              className="bg-primary hover:bg-primary/90"
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {publishing ? 'Đang xuất bản...' : 'Xuất bản ngay'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
