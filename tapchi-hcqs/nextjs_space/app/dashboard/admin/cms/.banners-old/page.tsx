
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Monitor,
  Tablet,
  Smartphone,
  Layout,
  BarChart3,
  Calendar,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Banner {
  id: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  linkTarget: string;
  altText?: string;
  deviceType: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    fullName: string;
    email: string;
  };
}

export default function BannersManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/banners');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data);
        
        // Generate signed URLs for all images
        const urls: Record<string, string> = {};
        await Promise.all(
          data.data.map(async (banner: Banner) => {
            try {
              const imageResponse = await fetch(`/api/banners/${banner.id}/image-url`);
              const imageData = await imageResponse.json();
              if (imageData.success && imageData.url) {
                urls[banner.id] = imageData.url;
              }
            } catch (error) {
              console.error('Error generating signed URL:', error);
            }
          })
        );
        setImageUrls(urls);
      } else {
        toast.error('Không thể tải danh sách banner');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append('isActive', String(!currentStatus));

      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Banner đã ${!currentStatus ? 'kích hoạt' : 'tắt'}`);
        fetchBanners();
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toast.error('Lỗi kết nối server');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/banners/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Đã xóa banner');
        fetchBanners();
      } else {
        toast.error('Không thể xóa banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Lỗi kết nối server');
    } finally {
      setDeleteId(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  const getDeviceLabel = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return 'Di động';
      case 'tablet':
        return 'Máy tính bảng';
      case 'desktop':
        return 'Máy tính';
      default:
        return 'Tất cả';
    }
  };

  const isScheduleActive = (banner: Banner) => {
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (start && start > now) return false;
    if (end && end < now) return false;
    return true;
  };

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Bạn không có quyền truy cập trang này
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            Quản lý Banner
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các banner hiển thị trên trang chủ
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/admin/cms/banners/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm Banner
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số</p>
                <p className="text-2xl font-bold">{banners.length}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">
                  {banners.filter(b => b.isActive && isScheduleActive(b)).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng lượt xem</p>
                <p className="text-2xl font-bold">
                  {banners.reduce((sum, b) => sum + b.viewCount, 0).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng lượt click</p>
                <p className="text-2xl font-bold text-purple-600">
                  {banners.reduce((sum, b) => sum + b.clickCount, 0).toLocaleString()}
                </p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banners List */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Chưa có banner nào</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu bằng cách thêm banner đầu tiên
            </p>
            <Button asChild>
              <Link href="/dashboard/admin/cms/banners/new">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Banner
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Banner Image */}
                <div className="relative w-full md:w-72 h-48 bg-muted flex-shrink-0">
                  {imageUrls[banner.id] ? (
                    <Image
                      src={imageUrls[banner.id]}
                      alt={banner.altText || banner.title || 'Banner'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  {!banner.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">
                        Đã tắt
                      </Badge>
                    </div>
                  )}
                  {banner.isActive && !isScheduleActive(banner) && (
                    <div className="absolute inset-0 bg-orange-500/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">
                        Ngoài lịch
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Banner Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {banner.title || banner.titleEn || 'Banner'}
                        </h3>
                        <Badge variant={banner.isActive && isScheduleActive(banner) ? 'default' : 'secondary'}>
                          {banner.isActive && isScheduleActive(banner) ? 'Hoạt động' : 'Tắt'}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getDeviceIcon(banner.deviceType)}
                          {getDeviceLabel(banner.deviceType)}
                        </Badge>
                      </div>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vị trí</p>
                      <p className="font-medium">#{banner.position + 1}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lượt xem</p>
                      <p className="font-medium">{banner.viewCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lượt click</p>
                      <p className="font-medium">{banner.clickCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p className="font-medium">
                        {banner.viewCount > 0 
                          ? ((banner.clickCount / banner.viewCount) * 100).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Schedule */}
                  {(banner.startDate || banner.endDate) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {banner.startDate && format(new Date(banner.startDate), 'dd/MM/yyyy', { locale: vi })}
                        {banner.startDate && banner.endDate && ' - '}
                        {banner.endDate && format(new Date(banner.endDate), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/cms/banners/${banner.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Sửa
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBannerStatus(banner.id, banner.isActive)}
                    >
                      {banner.isActive ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Tắt
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Bật
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(banner.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa banner</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
