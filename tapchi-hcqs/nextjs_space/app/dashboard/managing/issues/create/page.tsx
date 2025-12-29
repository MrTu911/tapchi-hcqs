
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function CreateIssuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [volumes, setVolumes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    volumeId: '',
    number: '',
    year: new Date().getFullYear().toString(),
    title: '',
    description: '',
    coverImage: '',
    doi: '',
    publishDate: '',
    status: 'DRAFT'
  })

  useEffect(() => {
    fetch('/api/volumes')
      .then(res => res.json())
      .then(data => setVolumes(data.volumes || []))
      .catch(err => console.error('Failed to fetch volumes:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.volumeId || !formData.number || !formData.year) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          number: parseInt(formData.number),
          year: parseInt(formData.year)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Tạo số tạp chí thành công')
        router.push('/dashboard/managing/issues')
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/managing/issues">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tạo số tạp chí mới</h1>
          <p className="text-muted-foreground mt-1">
            Tạo số tạp chí mới trong hệ thống
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin số tạp chí</CardTitle>
          <CardDescription>
            Điền thông tin chi tiết về số tạp chí
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
                  placeholder="Nhập số (1, 2, 3...)"
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
                placeholder="https://i.pinimg.com/736x/3b/f4/b5/3bf4b5bc2900fc2cd87004d09168d341.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Nhập URL của ảnh bìa hoặc upload sau
              </p>
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Đang lưu...' : 'Tạo số tạp chí'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/managing/issues">Hủy</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
