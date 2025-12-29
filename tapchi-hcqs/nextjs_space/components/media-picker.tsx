'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Search, X, Check, Image as ImageIcon, Loader2, 
  Upload, Filter, RefreshCw, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  usageCount: number;
  createdAt: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
  allowUpload?: boolean;
}

export function MediaPicker({ open, onClose, onSelect, allowUpload = true }: MediaPickerProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadAltText, setUploadAltText] = useState('');

  // Fetch media files
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();
      setMediaFiles(data.data || []);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Lỗi khi tải danh sách media');
    } finally {
      setLoading(false);
    }
  };

  // Upload media
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Vui lòng chọn file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('altText', uploadAltText);
      formData.append('isPublic', 'true');

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      toast.success('Upload thành công');
      
      // Reset form
      setUploadFile(null);
      setUploadAltText('');
      
      // Refresh media list
      fetchMedia();
      
      // Auto-select uploaded media
      if (result.data) {
        setSelectedMedia(result.data);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Lỗi khi upload');
    } finally {
      setUploading(false);
    }
  };

  // Handle select
  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  // Effects
  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, page, searchQuery, categoryFilter]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Chọn ảnh từ thư viện
          </DialogTitle>
          <DialogDescription>
            Chọn ảnh từ thư viện hoặc upload ảnh mới
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 border-b pb-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Tìm kiếm theo tên file..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => {
            setCategoryFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="news">Tin tức</SelectItem>
              <SelectItem value="article">Bài viết</SelectItem>
              <SelectItem value="profile">Hồ sơ</SelectItem>
              <SelectItem value="general">Chung</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMedia()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Upload Section (if allowed) */}
        {allowUpload && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <Label className="text-sm font-medium mb-2 block">Upload ảnh mới</Label>
            <div className="flex flex-wrap gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="flex-1 min-w-[200px]"
              />
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Chung</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="news">Tin tức</SelectItem>
                  <SelectItem value="article">Bài viết</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Alt text (optional)"
                value={uploadAltText}
                onChange={(e) => setUploadAltText(e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                size="sm"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Đang upload...' : 'Upload'}
              </Button>
            </div>
          </div>
        )}

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
              <p>Không có ảnh nào</p>
              <p className="text-sm">Thử thay đổi bộ lọc hoặc upload ảnh mới</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {mediaFiles.map((media) => (
                <div
                  key={media.id}
                  onClick={() => setSelectedMedia(media)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden cursor-pointer
                    border-2 transition-all hover:scale-105
                    ${
                      selectedMedia?.id === media.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="relative w-full h-full bg-muted">
                    <Image
                      src={getImageUrl(media.cloudStoragePath)}
                      alt={media.altText || media.fileName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                  {selectedMedia?.id === media.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Check className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">
                      {media.title || media.fileName}
                    </p>
                    {media.width && media.height && (
                      <p className="text-xs text-white/70">
                        {media.width} × {media.height}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Media Info */}
        {selectedMedia && (
          <div className="border-t pt-3 bg-muted/20 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Ảnh đã chọn:</h4>
            <div className="flex items-start gap-3">
              <div className="relative w-20 h-20 rounded border bg-muted flex-shrink-0">
                <Image
                  src={getImageUrl(selectedMedia.cloudStoragePath)}
                  alt={selectedMedia.altText || selectedMedia.fileName}
                  fill
                  className="object-cover rounded"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 text-sm space-y-1">
                <p className="font-medium">{selectedMedia.title || selectedMedia.fileName}</p>
                {selectedMedia.altText && (
                  <p className="text-muted-foreground text-xs">{selectedMedia.altText}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {selectedMedia.category && (
                    <Badge variant="outline" className="text-xs">
                      {selectedMedia.category}
                    </Badge>
                  )}
                  {selectedMedia.width && selectedMedia.height && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedMedia.width} × {selectedMedia.height}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {(selectedMedia.fileSize / 1024).toFixed(0)} KB
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Sau
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSelect} disabled={!selectedMedia}>
            <Check className="h-4 w-4 mr-2" />
            Chọn ảnh này
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
