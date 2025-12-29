
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { PlusCircle, Edit, Trash2, Eye, Loader2, AlertTriangle } from 'lucide-react'
import { IssueForm } from '@/components/dashboard/issue-form'

interface Volume {
  id: string
  volumeNo: number
  year: number
}

interface Issue {
  id: string
  volumeNo: number
  volume?: {
    volumeNo: number
    year: number
    title?: string
  }
  number: number
  year: number
  title?: string
  description?: string
  coverImage?: string
  pdfUrl?: string
  doi?: string
  publishDate?: string
  status: 'DRAFT' | 'PUBLISHED'
  _count?: {
    articles: number
  }
}

export default function IssuesManagementPage() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues')
      const data = await response.json()
      if (data.success || data.issues) {
        setIssues(data.issues || data.data || [])
      }
    } catch (error) {
      console.error('Fetch issues error:', error)
      toast.error('Lỗi tải danh sách số tạp chí')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setIsDialogOpen(false)
    setEditingIssue(null)
    fetchIssues()
    router.refresh()
  }

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (issue: Issue) => {
    setIssueToDelete(issue)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/issues/${issueToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Xóa số tạp chí thành công')
        fetchIssues()
        router.refresh()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi xóa số tạp chí')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setIssueToDelete(null)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingIssue(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Số Tạp chí</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý các số phát hành của tạp chí
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo Số Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIssue ? 'Chỉnh sửa Số Tạp chí' : 'Tạo Số Tạp chí Mới'}
              </DialogTitle>
              <DialogDescription>
                Điền thông tin chi tiết cho số tạp chí. Các trường có dấu * là bắt buộc.
              </DialogDescription>
            </DialogHeader>
            <IssueForm
              issue={editingIssue}
              onSuccess={handleFormSuccess}
              onCancel={() => handleDialogClose(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách các Số Tạp chí</CardTitle>
          <CardDescription>
            Tổng cộng: {issues.length} số tạp chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Đang tải...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tập - Số</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead className="text-center">Số bài</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày phát hành</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Eye className="h-12 w-12 opacity-20 mb-2" />
                          <p>Chưa có số tạp chí nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">
                          Tập {issue.volume?.volumeNo || '?'} - Số {issue.number}
                        </TableCell>
                        <TableCell>{issue.year}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {issue.title || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {issue._count?.articles || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {issue.publishDate
                            ? new Date(issue.publishDate).toLocaleDateString('vi-VN')
                            : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => router.push(`/dashboard/admin/issues/${issue.id}`)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(issue)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(issue)}
                              className="text-destructive hover:text-destructive"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xác nhận xóa số tạp chí
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa số tạp chí{' '}
              <strong>
                Tập {issueToDelete?.volume?.volumeNo || '?'} - Số {issueToDelete?.number} ({issueToDelete?.year})
              </strong>
              ?
              {issueToDelete && issueToDelete._count && issueToDelete._count.articles > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Số này có {issueToDelete._count.articles} bài viết. Bạn cần xóa các bài viết trước.
                </span>
              )}
              <br />
              <span className="block mt-2">
                Thao tác này không thể hoàn tác.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
