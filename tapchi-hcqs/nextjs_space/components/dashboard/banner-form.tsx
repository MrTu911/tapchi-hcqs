
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Upload, X, Calendar, Monitor, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface BannerFormProps {
  banner?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BannerForm({ banner, onSuccess, onCancel }: BannerFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    banner?.imageUrlSigned || banner?.imageUrl || ''
  );
  const [formData, setFormData] = useState({
    title: banner?.title || '',
    titleEn: banner?.titleEn || '',
    subtitle: banner?.subtitle || '',
    subtitleEn: banner?.subtitleEn || '',
    linkUrl: banner?.linkUrl || '',
    linkTarget: banner?.linkTarget || '_self',
    altText: banner?.altText || '',
    buttonText: banner?.buttonText || '',
    buttonTextEn: banner?.buttonTextEn || '',
    deviceType: banner?.deviceType || 'all',
    position: banner?.position?.toString() || '0',
    isActive: banner?.isActive ?? true,
    startDate: banner?.startDate ? banner.startDate.split('T')[0] : '',
    endDate: banner?.endDate ? banner.endDate.split('T')[0] : '',
    targetRole: banner?.targetRole || '',
  });

  // Handle input change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(banner?.imageUrlSigned || banner?.imageUrl || '');
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!imageFile && !banner?.imageUrl) {
      toast.error('Vui lòng chọn ảnh banner');
      return;
    }

    try {
      setLoading(true);

      // Prepare form data
      const submitData = new FormData();
      
      // Add image if new file selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      // Add other fields
      Object.entries(formData).forEach(([key, value]) => {
        // Skip "all" value for targetRole (means no specific target)
        if (key === 'targetRole' && value === 'all') {
          return;
        }
        if (value !== '' && value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });

      // Send request
      const url = banner ? `/api/banners/${banner.id}` : '/api/banners';
      const method = banner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(banner ? 'Đã cập nhật banner' : 'Đã tạo banner mới');
        onSuccess();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting banner:', error);
      toast.error('Lỗi khi lưu banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Ảnh Banner *</Label>
        <div className="border-2 border-dashed rounded-lg p-4">
          {imagePreview ? (
            <div className="relative">
              <div className="relative w-full aspect-[4/1] bg-muted rounded overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Định dạng: JPG, PNG, WebP. Kích thước tối đa: 5MB
              </p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className={imagePreview ? 'mt-2' : ''}
          />
        </div>
      </div>

      <Separator />

      {/* Titles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề (Tiếng Việt)</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Tiêu đề banner..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="titleEn">Tiêu đề (English)</Label>
          <Input
            id="titleEn"
            value={formData.titleEn}
            onChange={(e) => handleChange('titleEn', e.target.value)}
            placeholder="Banner title..."
          />
        </div>
      </div>

      {/* Subtitles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subtitle">Phụ đề (Tiếng Việt)</Label>
          <Textarea
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="Mô tả ngắn..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subtitleEn">Phụ đề (English)</Label>
          <Textarea
            id="subtitleEn"
            value={formData.subtitleEn}
            onChange={(e) => handleChange('subtitleEn', e.target.value)}
            placeholder="Short description..."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Link & Button */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkUrl">Đường dẫn khi click</Label>
            <Input
              id="linkUrl"
              value={formData.linkUrl}
              onChange={(e) => handleChange('linkUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkTarget">Mở liên kết</Label>
            <Select value={formData.linkTarget} onValueChange={(value) => handleChange('linkTarget', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Cùng tab</SelectItem>
                <SelectItem value="_blank">Tab mới</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buttonText">Text nút (Tiếng Việt)</Label>
            <Input
              id="buttonText"
              value={formData.buttonText}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              placeholder="Tìm hiểu thêm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buttonTextEn">Text nút (English)</Label>
            <Input
              id="buttonTextEn"
              value={formData.buttonTextEn}
              onChange={(e) => handleChange('buttonTextEn', e.target.value)}
              placeholder="Learn more"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="altText">Alt text (SEO)</Label>
          <Input
            id="altText"
            value={formData.altText}
            onChange={(e) => handleChange('altText', e.target.value)}
            placeholder="Mô tả ảnh cho SEO và accessibility..."
          />
        </div>
      </div>

      <Separator />

      {/* Display Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deviceType">Loại thiết bị</Label>
          <Select value={formData.deviceType} onValueChange={(value) => handleChange('deviceType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thiết bị</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Vị trí hiển thị</Label>
          <Input
            id="position"
            type="number"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-muted-foreground">Số nhỏ hơn sẽ hiển thị trước</p>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label>Lịch hiển thị</Label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Ngày bắt đầu</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Ngày kết thúc</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Để trống nếu muốn hiển thị vĩnh viễn
        </p>
      </div>

      {/* Targeting */}
      <div className="space-y-2">
        <Label htmlFor="targetRole">Hiển thị cho vai trò (tùy chọn)</Label>
        <Select value={formData.targetRole || "all"} onValueChange={(value) => handleChange('targetRole', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Tất cả người dùng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả người dùng</SelectItem>
            <SelectItem value="AUTHOR">Tác giả</SelectItem>
            <SelectItem value="REVIEWER">Phản biện</SelectItem>
            <SelectItem value="SECTION_EDITOR">Biên tập mục</SelectItem>
            <SelectItem value="MANAGING_EDITOR">Tổng biên tập</SelectItem>
            <SelectItem value="EIC">Tổng biên tập điều hành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Active Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Trạng thái hoạt động</Label>
          <p className="text-xs text-muted-foreground">
            Banner sẽ chỉ hiển thị khi được bật
          </p>
        </div>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => handleChange('isActive', checked)}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {banner ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
