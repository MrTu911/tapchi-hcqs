"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { BookOpen, Plus, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Volume {
  id: string;
  volumeNo: number;
  year: number;
  title?: string;
  description?: string;
  createdAt: string;
  _count: {
    issues: number;
  };
}

export default function VolumesManagementPage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; volumeId: string | null }>({
    open: false,
    volumeId: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    volumeNo: '',
    year: new Date().getFullYear().toString(),
    title: '',
    description: '',
  });

  // Fetch volumes
  const fetchVolumes = async () => {
    try {
      const res = await fetch('/api/volumes');
      const data = await res.json();
      if (data.success) {
        setVolumes(data.data);
      }
    } catch (error) {
      console.error('Error fetching volumes:', error);
      toast.error('Không thể tải danh sách tập');
    } finally {
      setLoading(false);
    }
  };

  // Create or update volume
  const handleSubmit = async () => {
    if (!formData.volumeNo || !formData.year) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const url = editingVolume ? `/api/volumes/${editingVolume.id}` : '/api/volumes';
      const method = editingVolume ? 'PUT' : 'POST';
      
      const payload = {
        volumeNo: parseInt(formData.volumeNo),
        year: parseInt(formData.year),
        title: formData.title || undefined,
        description: formData.description || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (editingVolume ? 'Cập nhật thành công' : 'Tạo tập thành công'));
        setIsDialogOpen(false);
        resetForm();
        await fetchVolumes();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Delete volume
  const handleDelete = async () => {
    if (!deleteDialog.volumeId) return;

    try {
      const res = await fetch(`/api/volumes/${deleteDialog.volumeId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa tập');
        await fetchVolumes();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setDeleteDialog({ open: false, volumeId: null });
    }
  };

  const openEditDialog = (volume: Volume) => {
    setEditingVolume(volume);
    setFormData({
      volumeNo: volume.volumeNo.toString(),
      year: volume.year.toString(),
      title: volume.title || '',
      description: volume.description || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVolume(null);
    setFormData({
      volumeNo: '',
      year: new Date().getFullYear().toString(),
      title: '',
      description: '',
    });
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tập tạp chí</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các tập (Volumes) của tạp chí
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo tập mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVolume ? 'Cập nhật tập' : 'Tạo tập mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="volumeNo">Số tập *</Label>
                  <Input
                    id="volumeNo"
                    type="number"
                    value={formData.volumeNo}
                    onChange={(e) => setFormData({ ...formData, volumeNo: e.target.value })}
                    placeholder="VD: 1"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Năm *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="VD: 2025"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Tập 1 - Năm 2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về tập này"
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  editingVolume ? 'Cập nhật' : 'Tạo tập'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số tập</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số số</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {volumes.reduce((sum, v) => sum + v._count.issues, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Năm mới nhất</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {volumes.length > 0 ? Math.max(...volumes.map(v => v.year)) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tập</CardTitle>
        </CardHeader>
        <CardContent>
          {volumes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có tập nào</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số tập</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Số lượng số</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volumes.map((volume) => (
                    <TableRow key={volume.id}>
                      <TableCell className="font-medium">Tập {volume.volumeNo}</TableCell>
                      <TableCell>{volume.year}</TableCell>
                      <TableCell className="max-w-md">
                        {volume.title || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{volume._count.issues} số</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(volume)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: true, volumeId: volume.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, volumeId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tập</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tập này? Chỉ có thể xóa nếu tập không có số nào. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa tập
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
