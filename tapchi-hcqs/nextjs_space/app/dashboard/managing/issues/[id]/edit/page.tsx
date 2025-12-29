
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function EditIssuePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [volumes, setVolumes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    volumeId: '',
    number: '',
    year: '',
    title: '',
    description: '',
    coverImage: '',
    doi: '',
    publishDate: '',
    status: 'DRAFT'
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/issues/${params.id}`).then(res => res.json()),
      fetch('/api/volumes').then(res => res.json())
    ]).then(([issueData, volumesData]) => {
      if (issueData.success && issueData.issue) {
        const issue = issueData.issue
        setFormData({
          volumeId: issue.volumeId,
          number: issue.number.toString(),
          year: issue.year.toString(),
          title: issue.title || '',
          description: issue.description || '',
          coverImage: issue.coverImage || '',
          doi: issue.doi || '',
          publishDate: issue.publishDate ? new Date(issue.publishDate).toISOString().split('T')[0] : '',
          status: issue.status
        })
      }
      setVolumes(volumesData.volumes || [])
      setLoading(false)
    }).catch(err => {
      console.error('Failed to fetch data:', err)
      toast.error('Không thể tải thông tin')
      setLoading(false)
    })
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.volumeId || !formData.number || !formData.year) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/issues/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          number: parseInt(formData.number),
          year: parseInt(formData.year)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cập nhật thành công')
        router.push(`/dashboard/managing/issues/${params.id}`)
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/issues/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Xóa thành công')
        router.push('/dashboard/managing/issues')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Không thể xóa')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/managing/issues/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chỉnh sửa số tạp chí</h1>
          <p className="text-muted-foreground mt-1">
            Cập nhật thông tin số tạp chí
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin số tạp chí</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin chi tiết về số tạp chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volumeId">Tập <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.volumeId}
                  onValueChange={(value) => setFormData({ ...formData, volumeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tập" />
                  </SelectTrigger>
                  <SelectContent>
                    {volumes.map((vol) => (
                      <SelectItem key={vol.id} value={vol.id}>
                        Tập {vol.volumeNo} - {vol.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Số <span className="text-red-500">*</span></Label>
                <Input
                  id="number"
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Năm <span className="text-red-500">*</span></Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Số chuyên đề hoặc tiêu đề đặc biệt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về số này"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Ảnh bìa (URL)</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://thumbs.dreamstime.com/b/cover-landscape-book-mock-up-illustration-presentation-scene-layout-showcase-branding-portfolio-393564899.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="10.xxxxx/xxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishDate">Ngày xuất bản</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 justify-between">
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/dashboard/managing/issues/${params.id}`}>Hủy</Link>
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={deleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa số tạp chí này? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
