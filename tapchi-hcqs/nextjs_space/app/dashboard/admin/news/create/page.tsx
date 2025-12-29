
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { ModernEditor } from '@/components/modern-editor';
import Image from 'next/image';

const NEWS_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Papers' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'research_news', label: 'Tin nghiên cứu' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'conference', label: 'Hội thảo' },
];

export default function CreateNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    coverImage: '',
    category: '',
    tags: '',
    isPublished: false,
    isFeatured: false,
    publishedAt: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploadingCover(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/news/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        handleChange('coverImage', data.data.url);
        toast.success('Đã upload ảnh đại diện');
      } else {
        toast.error(data.message || 'Lỗi khi upload ảnh');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi upload ảnh');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        publishedAt: formData.publishedAt || (formData.isPublished ? new Date().toISOString() : null),
      };

      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Đã tạo tin tức thành công');
        router.push('/dashboard/admin/news');
        router.refresh();
      } else {
        toast.error(data.message || 'Lỗi khi tạo tin tức');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi tạo tin tức');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tạo tin tức mới</h1>
          <p className="text-muted-foreground">
            Soạn và xuất bản tin tức, thông báo, sự kiện
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Nội dung chính</CardTitle>
                <CardDescription>Nhập tiêu đề và nội dung tin tức (Tiếng Việt)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Tiêu đề <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Nhập tiêu đề tin tức..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Tóm tắt</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    placeholder="Nhập tóm tắt ngắn gọn..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Nội dung <span className="text-red-500">*</span></Label>
                  <ModernEditor
                    value={formData.content}
                    onChange={(value) => handleChange('content', value)}
                    placeholder="Gõ '/' để xem lệnh nhanh... Bắt đầu viết nội dung tin tức"
                    height="500px"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nội dung tiếng Anh (Tùy chọn)</CardTitle>
                <CardDescription>Nhập tiêu đề và nội dung bản tiếng Anh</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titleEn">English Title</Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn}
                    onChange={(e) => handleChange('titleEn', e.target.value)}
                    placeholder="Enter English title..."
                  />
                </div>

                <div>
                  <Label htmlFor="summaryEn">English Summary</Label>
                  <Textarea
                    id="summaryEn"
                    value={formData.summaryEn}
                    onChange={(e) => handleChange('summaryEn', e.target.value)}
                    placeholder="Enter brief summary..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>English Content</Label>
                  <ModernEditor
                    value={formData.contentEn}
                    onChange={(value) => handleChange('contentEn', value)}
                    placeholder="Type '/' for quick commands... Start writing English content"
                    height="500px"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublished">Xuất bản ngay</Label>
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => handleChange('isPublished', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Tin nổi bật</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  />
                </div>

                {formData.isPublished && (
                  <div>
                    <Label htmlFor="publishedAt">Ngày xuất bản</Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={(e) => handleChange('publishedAt', e.target.value)}
                    />
                  </div>
                )}

                <Separator />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu tin tức
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
                <CardDescription>Kích thước đề nghị: 1200x630px</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.coverImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <Image
                      src={formData.coverImage}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleChange('coverImage', '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        {uploadingCover ? 'Đang upload...' : 'Chọn ảnh đại diện'}
                      </span>
                      <Input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageUpload}
                        disabled={uploadingCover}
                      />
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân loại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Thẻ tag (phân cách bởi dấu phẩy)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="ví dụ: hội thảo, nghiên cứu, quốc tế"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
