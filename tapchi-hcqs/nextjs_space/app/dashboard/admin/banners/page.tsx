
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Eye, Loader2, Image as ImageIcon, Calendar, Monitor, Smartphone, Tablet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import BannerForm from '@/components/dashboard/banner-form';

interface Banner {
  id: string;
  title?: string;
  titleEn?: string;
  imageUrl: string;
  linkUrl?: string;
  deviceType: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  clickCount: number;
  createdAt: string;
  creator?: {
    fullName: string;
  };
}

export default function BannersManagementPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/banners');
      const result = await response.json();
      
      if (result.success) {
        setBanners(result.data || []);
      } else {
        toast.error('Không thể tải danh sách banner');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Lỗi khi tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle create
  const handleCreate = () => {
    setSelectedBanner(null);
    setIsDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteClick = (bannerId: string) => {
    setBannerToDelete(bannerId);
    setDeleteDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!bannerToDelete) return;

    try {
      const response = await fetch(`/api/banners/${bannerToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Đã xóa banner thành công');
        fetchBanners();
      } else {
        toast.error(result.error || 'Không thể xóa banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Lỗi khi xóa banner');
    } finally {
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setSelectedBanner(null);
    fetchBanners();
  };

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Check if banner is currently active (within date range)
  const isBannerCurrentlyActive = (banner: Banner) => {
    if (!banner.isActive) return false;
    
    const now = new Date();
    const startDate = banner.startDate ? new Date(banner.startDate) : null;
    const endDate = banner.endDate ? new Date(banner.endDate) : null;

    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;

    return true;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Quản lý Banner</CardTitle>
              <CardDescription>
                Quản lý banner hiển thị trên trang chủ và các trang khác
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Thêm Banner Mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner Mới'}
                  </DialogTitle>
                </DialogHeader>
                <BannerForm
                  banner={selectedBanner}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có banner nào</p>
              <Button onClick={handleCreate} className="mt-4">
                <PlusCircle className="h-4 w-4 mr-2" />
                Tạo Banner Đầu Tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead className="text-center">Vị trí</TableHead>
                  <TableHead>Lịch hiển thị</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Lượt xem</TableHead>
                  <TableHead className="text-center">Lượt click</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="relative w-16 h-10 bg-muted rounded overflow-hidden">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || 'Banner'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {banner.title || banner.titleEn || 'Không có tiêu đề'}
                      </div>
                      {banner.creator && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Tạo bởi: {banner.creator.fullName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(banner.deviceType)}
                        <span className="text-sm capitalize">{banner.deviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{banner.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {banner.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Từ: {format(new Date(banner.startDate), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                        )}
                        {banner.endDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Đến: {format(new Date(banner.endDate), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                        )}
                        {!banner.startDate && !banner.endDate && (
                          <span className="text-muted-foreground">Luôn hiển thị</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isBannerCurrentlyActive(banner) ? (
                        <Badge className="bg-green-500">Đang hiển thị</Badge>
                      ) : banner.isActive ? (
                        <Badge variant="secondary">Đã lên lịch</Badge>
                      ) : (
                        <Badge variant="outline">Tạm ẩn</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span>{banner.viewCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {banner.clickCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
