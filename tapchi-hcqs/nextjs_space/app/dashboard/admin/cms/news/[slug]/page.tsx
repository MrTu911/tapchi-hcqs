
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const categories = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Paper' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'news', label: 'Tin tức' },
];

export default function EditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    summary: '',
    summaryEn: '',
    content: '',
    contentEn: '',
    coverImage: '',
    category: 'announcement',
    tags: '',
    isPublished: false,
    isFeatured: false,
  });

  useEffect(() => {
    fetchNews();
  }, [slug]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`/api/news/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        const news = data.data;
        setFormData({
          title: news.title || '',
          titleEn: news.titleEn || '',
          summary: news.summary || '',
          summaryEn: news.summaryEn || '',
          content: news.content || '',
          contentEn: news.contentEn || '',
          coverImage: news.coverImage || '',
          category: news.category || 'announcement',
          tags: news.tags?.join(', ') || '',
          isPublished: news.isPublished || false,
          isFeatured: news.isFeatured || false,
        });
      } else {
        toast.error(data.message || 'Không tìm thấy tin tức');
        router.push('/dashboard/admin/cms/news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Lỗi khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, coverImage: data.url }));
        toast.success('Upload ảnh thành công');
      } else {
        toast.error(data.message || 'Lỗi khi upload ảnh');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setSaving(true);

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const response = await fetch(`/api/news/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật tin tức thành công');
        router.push('/dashboard/admin/cms/news');
      } else {
        toast.error(data.message || 'Lỗi khi cập nhật tin tức');
      }
    } catch (error) {
      console.error('Error updating news:', error);
      toast.error('Lỗi khi cập nhật tin tức');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold">Chỉnh sửa tin tức</h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="vi" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>

                <TabsContent value="vi" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Nhập tiêu đề tin tức..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Tóm tắt</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData({ ...formData, summary: e.target.value })
                      }
                      placeholder="Tóm tắt nội dung..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Nội dung *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Nội dung chi tiết..."
                      rows={15}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ HTML
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="en" className="space-y-4">
                  <div>
                    <Label htmlFor="titleEn">Title (English)</Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) =>
                        setFormData({ ...formData, titleEn: e.target.value })
                      }
                      placeholder="Enter title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="summaryEn">Summary</Label>
                    <Textarea
                      id="summaryEn"
                      value={formData.summaryEn}
                      onChange={(e) =>
                        setFormData({ ...formData, summaryEn: e.target.value })
                      }
                      placeholder="Summary..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contentEn">Content</Label>
                    <Textarea
                      id="contentEn"
                      value={formData.contentEn}
                      onChange={(e) =>
                        setFormData({ ...formData, contentEn: e.target.value })
                      }
                      placeholder="Content..."
                      rows={15}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published">Công khai</Label>
                <Switch
                  id="published"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublished: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Nổi bật</Label>
                <Switch
                  id="featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFeatured: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ảnh bìa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.coverImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Đang upload...' : 'Click để upload ảnh'}
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </Label>
              </div>

              <div>
                <Label htmlFor="coverImage">Hoặc nhập URL</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  placeholder="https://i.ytimg.com/vi/h20032z0wgM/maxresdefault.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
