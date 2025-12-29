'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PlusCircle, Edit, Trash2, Eye, Loader2, Youtube, Upload, X, Play, FileVideo } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Video {
  id: string
  title: string
  titleEn?: string
  description?: string
  videoType: string
  videoUrl: string
  cloudStoragePath?: string
  category?: string
  tags: string[]
  isFeatured: boolean
  isActive: boolean
  displayOrder: number
  views: number
  publishedAt?: string
  createdAt: string
}

export default function VideosManagementPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'youtube'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    description: '',
    videoUrl: '',
    category: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/videos')
      const data = await response.json()
      if (data.success) {
        setVideos(data.data.videos || [])
      }
    } catch (error) {
      toast.error('Không thể tải danh sách video')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (video?: Video) => {
    if (video) {
      setEditingVideo(video)
      setUploadMethod(video.videoType === 'upload' ? 'file' : 'youtube')
      setFormData({
        title: video.title,
        titleEn: video.titleEn || '',
        description: video.description || '',
        videoUrl: video.videoType === 'youtube' ? video.videoUrl : '',
        category: video.category || '',
        tags: video.tags?.join(', ') || '',
        isFeatured: video.isFeatured,
        isActive: video.isActive,
        displayOrder: video.displayOrder,
      })
    } else {
      setEditingVideo(null)
      setSelectedFile(null)
      setVideoPreview(null)
      setFormData({
        title: '',
        titleEn: '',
        description: '',
        videoUrl: '',
        category: '',
        tags: '',
        isFeatured: false,
        isActive: true,
        displayOrder: 0,
      })
    }
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận MP4, WebM, OGG')
      return
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File vượt quá 100MB')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    return match ? match[1] : ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }

    if (uploadMethod === 'file' && !selectedFile && !editingVideo) {
      toast.error('Vui lòng chọn file video')
      return
    }

    if (uploadMethod === 'youtube' && !formData.videoUrl) {
      toast.error('Vui lòng nhập URL YouTube')
      return
    }

    setIsSubmitting(true)

    try {
      if (uploadMethod === 'file' && selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)
        uploadFormData.append('title', formData.title)
        if (formData.titleEn) uploadFormData.append('titleEn', formData.titleEn)
        if (formData.description) uploadFormData.append('description', formData.description)
        if (formData.category) uploadFormData.append('category', formData.category)
        if (formData.tags) uploadFormData.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())))
        uploadFormData.append('isFeatured', String(formData.isFeatured))
        uploadFormData.append('isActive', String(formData.isActive))
        uploadFormData.append('displayOrder', String(formData.displayOrder))

        const response = await fetch('/api/videos', {
          method: 'POST',
          body: uploadFormData,
        })

        const data = await response.json()
        
        if (data.success) {
          toast.success('Upload thành công!')
          setIsDialogOpen(false)
          fetchVideos()
          handleRemoveFile()
        } else {
          toast.error(data.error || 'Lỗi upload')
        }
      } else {
        const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        
        const payload = {
          title: formData.title,
          titleEn: formData.titleEn || null,
          description: formData.description || null,
          videoType: 'youtube',
          videoUrl: formData.videoUrl,
          videoId: extractYouTubeId(formData.videoUrl),
          category: formData.category || null,
          tags: tagsArray,
          isFeatured: formData.isFeatured,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          publishedAt: formData.isActive ? new Date().toISOString() : null,
        }

        const url = editingVideo ? `/api/videos/${editingVideo.id}` : '/api/videos'
        const method = editingVideo ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await response.json()
        
        if (data.success) {
          toast.success(editingVideo ? 'Cập nhật thành công' : 'Thêm mới thành công')
          setIsDialogOpen(false)
          fetchVideos()
        } else {
          toast.error(data.error || 'Có lỗi xảy ra')
        }
      }
    } catch (error) {
      toast.error('Không thể thực hiện')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteVideoId) return

    try {
      const response = await fetch(`/api/videos/${deleteVideoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Đã xóa video')
        fetchVideos()
      } else {
        toast.error('Không thể xóa')
      }
    } catch (error) {
      toast.error('Lỗi khi xóa')
    } finally {
      setDeleteVideoId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quản lý Video
          </h1>
          <p className="text-gray-600 mt-1">Upload video hoặc nhúng từ YouTube</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm Video
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileVideo className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600">Chưa có video nào</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {video.videoType === 'youtube' ? (
                        <Youtube className="h-5 w-5 text-red-600" />
                      ) : (
                        <FileVideo className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <div className="font-medium">{video.title}</div>
                        {video.titleEn && (
                          <div className="text-sm text-gray-500">{video.titleEn}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={video.videoType === 'youtube' ? 'default' : 'secondary'}>
                      {video.videoType === 'youtube' ? 'YouTube' : 'Upload'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={video.isActive ? 'default' : 'secondary'}>
                      {video.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span>{video.views}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deleteVideoId === video.id} onOpenChange={(open) => !open && setDeleteVideoId(null)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteVideoId(video.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc muốn xóa video này?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? 'Chỉnh sửa Video' : 'Thêm Video Mới'}
            </DialogTitle>
            <DialogDescription>
              {editingVideo 
                ? 'Cập nhật thông tin video. Thay đổi sẽ được lưu vào hệ thống.' 
                : 'Tải lên video từ máy tính hoặc nhúng video từ YouTube. Video sẽ hiển thị trên trang chủ.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!editingVideo && (
              <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'file' | 'youtube')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="youtube">
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 mt-4">
                  <div>
                    <Label>Chọn video (MP4, WebM, OGG - Tối đa 100MB)</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={handleFileChange}
                      className="mt-2"
                    />
                  </div>

                  {videoPreview && (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="youtube" className="space-y-4 mt-4">
                  <div>
                    <Label>URL YouTube</Label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="space-y-4">
              <div>
                <Label>Tiêu đề (Tiếng Việt) *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề video"
                  required
                />
              </div>

              <div>
                <Label>Tiêu đề (English)</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về video"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="VD: Nghiên cứu, Hội thảo"
                  />
                </div>

                <div>
                  <Label>Thứ tự hiển thị</Label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Từ khóa (phân cách bằng dấu phẩy)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="khoa học, nghiên cứu, hậu cần"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label>Nổi bật</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Kích hoạt</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVideo ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
