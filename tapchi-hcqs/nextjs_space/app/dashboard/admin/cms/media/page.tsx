'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Upload, Trash2, Search, Filter, X, Eye, Copy, 
  FileText, Image as ImageIcon, Loader2, CheckCircle,
  Download, Edit3, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getImageUrl } from '@/lib/image-utils';

interface MediaFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudStoragePath: string;
  altText: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  width: number | null;
  height: number | null;
  isPublic: boolean;
  uploadedBy: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function MediaLibraryPage() {
  const router = useRouter();
  
  // State
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  
  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);
  
  // Edit form state
  const [editAltText, setEditAltText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Fetch media files
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(fileTypeFilter !== 'all' && { fileType: fileTypeFilter }),
      });

      const response = await fetch(`/api/media?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMediaFiles(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to fetch media');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, categoryFilter, fileTypeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('altText', uploadAltText || uploadFile.name);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('isPublic', uploadIsPublic.toString());

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Media uploaded successfully');
        setShowUploadDialog(false);
        resetUploadForm();
        fetchMedia();
      } else {
        toast.error(data.message || 'Failed to upload media');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  // Handle file edit
  const handleEdit = async () => {
    if (!selectedMedia) return;

    try {
      const response = await fetch(`/api/media/${selectedMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altText: editAltText,
          title: editTitle,
          description: editDescription,
          category: editCategory,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Media updated successfully');
        setShowEditDialog(false);
        setSelectedMedia(null);
        fetchMedia();
      } else {
        toast.error(data.message || 'Failed to update media');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error('Failed to update media');
    }
  };

  // Handle file delete
  const handleDelete = async () => {
    if (!selectedMedia) return;

    try {
      const response = await fetch(`/api/media/${selectedMedia.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Media deleted successfully');
        setShowDeleteDialog(false);
        setSelectedMedia(null);
        fetchMedia();
      } else {
        toast.error(data.message || 'Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  // Copy URL to clipboard
  const copyUrl = async (cloudStoragePath: string) => {
    try {
      const url = getImageUrl(cloudStoragePath);
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadCategory('general');
    setUploadAltText('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadIsPublic(false);
  };

  // Open edit dialog
  const openEditDialog = (media: MediaFile) => {
    setSelectedMedia(media);
    setEditAltText(media.altText || '');
    setEditTitle(media.title || '');
    setEditDescription(media.description || '');
    setEditCategory(media.category || 'general');
    setShowEditDialog(true);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ImageIcon className="h-6 w-6" />
            Thư viện Media
          </CardTitle>
          <CardDescription>
            Quản lý tập trung các file hình ảnh, video, tài liệu của hệ thống
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search">Tìm kiếm</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Tìm theo tên file, tiêu đề, alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="min-w-[150px]">
          <Label htmlFor="category">Danh mục</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="news">Tin tức</SelectItem>
              <SelectItem value="article">Bài báo</SelectItem>
              <SelectItem value="profile">Hồ sơ</SelectItem>
              <SelectItem value="general">Tổng quát</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Type Filter */}
        <div className="min-w-[150px]">
          <Label htmlFor="fileType">Loại file</Label>
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger id="fileType" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="image/">Hình ảnh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Tải lên
        </Button>

        <Button
          variant="outline"
          onClick={fetchMedia}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
            <p className="text-sm text-gray-600">Tổng số file</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mediaFiles.filter(m => m.category === 'banner').length}
            </div>
            <p className="text-sm text-gray-600">Banner</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mediaFiles.filter(m => m.category === 'news').length}
            </div>
            <p className="text-sm text-gray-600">Tin tức</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {mediaFiles.filter(m => m.usageCount > 0).length}
            </div>
            <p className="text-sm text-gray-600">Đang sử dụng</p>
          </CardContent>
        </Card>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có file nào. Hãy tải lên file đầu tiên!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaFiles.map((media) => (
            <Card key={media.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {/* Thumbnail */}
                <div className="relative aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                  {media.fileType.startsWith('video/') ? (
                    // Video thumbnail with play icon
                    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <FileText className="w-12 h-12 text-blue-300 absolute top-4 left-4" />
                      <Badge className="absolute top-2 right-2 bg-blue-600">Video</Badge>
                    </div>
                  ) : (
                    // Image thumbnail
                    <Image
                      src={getImageUrl(media.cloudStoragePath)}
                      alt={media.altText || media.fileName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.svg';
                      }}
                    />
                  )}
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedMedia(media);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyUrl(media.cloudStoragePath)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate flex-1" title={media.fileName}>
                      {media.fileName}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatFileSize(media.fileSize)}</span>
                    {media.category && (
                      <Badge variant="outline" className="text-xs">
                        {media.category}
                      </Badge>
                    )}
                  </div>

                  {media.width && media.height && (
                    <p className="text-xs text-gray-500">
                      {media.width} x {media.height}px
                    </p>
                  )}

                  {media.usageCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Sử dụng: {media.usageCount}
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditDialog(media)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMedia(media);
                        setShowDeleteDialog(true);
                      }}
                      disabled={media.usageCount > 0}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
          >
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tải lên Media</DialogTitle>
            <DialogDescription>
              Tải lên hình ảnh mới vào thư viện media
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File input */}
            <div>
              <Label htmlFor="file">Chọn file *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    if (!uploadAltText) setUploadAltText(file.name);
                  }
                }}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Định dạng hỗ trợ: JPG, PNG, GIF, WebP. Tối đa 10MB
              </p>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="upload-category">Danh mục *</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger id="upload-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Tổng quát</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="news">Tin tức</SelectItem>
                  <SelectItem value="article">Bài báo</SelectItem>
                  <SelectItem value="profile">Hồ sơ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alt Text */}
            <div>
              <Label htmlFor="alt-text">Alt Text *</Label>
              <Input
                id="alt-text"
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                placeholder="Mô tả ngắn gọn cho accessibility"
                className="mt-1"
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Tiêu đề hiển thị"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Mô tả chi tiết về hình ảnh"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                resetUploadForm();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Tải lên
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.fileName}</DialogTitle>
            <DialogDescription>
              {selectedMedia?.description || 'Xem trước hình ảnh'}
            </DialogDescription>
          </DialogHeader>

          {selectedMedia && (
            <div className="space-y-4">
              {/* Media Preview */}
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedMedia.fileType.startsWith('video/') ? (
                  // Video Player
                  <video 
                    src={getImageUrl(selectedMedia.cloudStoragePath)} 
                    controls
                    className="w-full h-full object-contain"
                  >
                    <source src={getImageUrl(selectedMedia.cloudStoragePath)} type={selectedMedia.fileType} />
                    Trình duyệt của bạn không hỗ trợ video này.
                  </video>
                ) : (
                  // Image Display
                  <Image
                    src={getImageUrl(selectedMedia.cloudStoragePath)}
                    alt={selectedMedia.altText || selectedMedia.fileName}
                    fill
                    className="object-contain"
                  />
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Loại file</p>
                  <p className="font-medium">{selectedMedia.fileType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Kích thước file</p>
                  <p className="font-medium">{formatFileSize(selectedMedia.fileSize)}</p>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <p className="text-gray-600">Kích thước</p>
                    <p className="font-medium">{selectedMedia.width} x {selectedMedia.height}px</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Danh mục</p>
                  <p className="font-medium">{selectedMedia.category || 'Không xác định'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sử dụng</p>
                  <p className="font-medium">{selectedMedia.usageCount} lần</p>
                </div>
                <div>
                  <p className="text-gray-600">Ngày tải lên</p>
                  <p className="font-medium">{formatDate(selectedMedia.createdAt)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedMedia && copyUrl(selectedMedia.cloudStoragePath)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button onClick={() => setShowPreviewDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin Media</DialogTitle>
            <DialogDescription>
              Cập nhật metadata cho file media
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category">Danh mục</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger id="edit-category" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Tổng quát</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="news">Tin tức</SelectItem>
                  <SelectItem value="article">Bài báo</SelectItem>
                  <SelectItem value="profile">Hồ sơ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-alt">Alt Text</Label>
              <Input
                id="edit-alt"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-desc">Mô tả</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa file "{selectedMedia?.fileName}" không?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
