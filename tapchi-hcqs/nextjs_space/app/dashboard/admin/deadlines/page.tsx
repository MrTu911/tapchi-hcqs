"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Loader2,
  Filter,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Deadline {
  id: string;
  submissionId: string;
  type: string;
  dueDate: string;
  assignedTo: string | null;
  completedAt: string | null;
  isOverdue: boolean;
  remindersSent: number;
  note: string | null;
  createdAt: string;
  submission: {
    id: string;
    title: string;
    code: string;
    status: string;
  };
  assignedUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

const deadlineTypeLabels: Record<string, string> = {
  REVIEW: 'Phản biện',
  REVISION: 'Chỉnh sửa',
  DECISION: 'Quyết định',
  PUBLICATION: 'Xuất bản',
};

export default function DeadlinesManagementPage() {
  const { data: session } = useSession();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [filteredDeadlines, setFilteredDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  
  // Form states
  const [submissionId, setSubmissionId] = useState('');
  const [type, setType] = useState('REVIEW');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchDeadlines();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = deadlines;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((d) => d.type === typeFilter);
    }

    if (statusFilter === 'pending') {
      filtered = filtered.filter((d) => !d.completedAt);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((d) => d.completedAt);
    } else if (statusFilter === 'overdue') {
      filtered = filtered.filter((d) => d.isOverdue);
    }

    setFilteredDeadlines(filtered);
  }, [typeFilter, statusFilter, deadlines]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/deadlines');
      const data = await res.json();

      if (data.success) {
        setDeadlines(data.data);
      } else {
        toast.error('Không thể tải danh sách deadline');
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast.error('Lỗi khi tải danh sách deadline');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!submissionId || !type || !dueDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch('/api/admin/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          type,
          dueDate,
          assignedTo: assignedTo || null,
          note: note || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowAddDialog(false);
        resetForm();
        fetchDeadlines();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding deadline:', error);
      toast.error('Lỗi khi thêm deadline');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDeadline) return;

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/deadlines/${selectedDeadline.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate,
          assignedTo: assignedTo || null,
          note: note || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowEditDialog(false);
        resetForm();
        fetchDeadlines();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast.error('Lỗi khi cập nhật deadline');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/deadlines/${id}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        fetchDeadlines();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error completing deadline:', error);
      toast.error('Lỗi khi đánh dấu hoàn thành');
    }
  };

  const handleDelete = async () => {
    if (!selectedDeadline) return;

    try {
      setProcessing(true);
      const res = await fetch(
        `/api/admin/deadlines?id=${selectedDeadline.id}`,
        { method: 'DELETE' }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowDeleteDialog(false);
        setSelectedDeadline(null);
        fetchDeadlines();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting deadline:', error);
      toast.error('Lỗi khi xóa deadline');
    } finally {
      setProcessing(false);
    }
  };

  const openEditDialog = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
    setDueDate(format(new Date(deadline.dueDate), "yyyy-MM-dd'T'HH:mm"));
    setAssignedTo(deadline.assignedTo || '');
    setNote(deadline.note || '');
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setSubmissionId('');
    setType('REVIEW');
    setDueDate('');
    setAssignedTo('');
    setNote('');
    setSelectedDeadline(null);
  };

  const getStatusBadge = (deadline: Deadline) => {
    if (deadline.completedAt) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Hoàn thành
        </Badge>
      );
    }
    if (deadline.isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Quá hạn
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        <Clock className="h-3 w-3 mr-1" />
        Đang chờ
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Quản lý Deadline
          </h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi và quản lý các deadline phản biện và biên tập
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm deadline
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deadlines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chờ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deadlines.filter((d) => !d.completedAt && !d.isOverdue).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quá hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deadlines.filter((d) => d.isOverdue).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hoàn thành
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deadlines.filter((d) => d.completedAt).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="REVIEW">Phản biện</SelectItem>
                <SelectItem value="REVISION">Chỉnh sửa</SelectItem>
                <SelectItem value="DECISION">Quyết định</SelectItem>
                <SelectItem value="PUBLICATION">Xuất bản</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Deadline ({filteredDeadlines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDeadlines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có deadline nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã bài</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Hạn chốt</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeadlines.map((deadline) => (
                    <TableRow key={deadline.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/editor/submissions/${deadline.submissionId}`}
                          className="hover:underline"
                        >
                          {deadline.submission.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {deadline.submission.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deadlineTypeLabels[deadline.type] || deadline.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(deadline.dueDate), 'dd/MM/yyyy HH:mm', {
                            locale: vi,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {deadline.assignedUser ? (
                          <div className="text-sm">
                            {deadline.assignedUser.fullName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(deadline)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!deadline.completedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComplete(deadline.id)}
                              title="Đánh dấu hoàn thành"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(deadline)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDeadline(deadline);
                              setShowDeleteDialog(true);
                            }}
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Deadline mới</DialogTitle>
            <DialogDescription>
              Tạo deadline mới cho bài báo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="submission-id">Mã bài báo *</Label>
              <Input
                id="submission-id"
                value={submissionId}
                onChange={(e) => setSubmissionId(e.target.value)}
                placeholder="Nhập ID bài báo..."
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Loại deadline *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REVIEW">Phản biện</SelectItem>
                  <SelectItem value="REVISION">Chỉnh sửa</SelectItem>
                  <SelectItem value="DECISION">Quyết định</SelectItem>
                  <SelectItem value="PUBLICATION">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due-date">Hạn chốt *</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="assigned-to">Người thực hiện (ID)</Label>
              <Input
                id="assigned-to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nhập ID người dùng..."
              />
            </div>

            <div>
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleAdd} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Deadline</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bài báo</Label>
              <p className="font-medium">
                {selectedDeadline?.submission.code} -{' '}
                {selectedDeadline?.submission.title}
              </p>
            </div>

            <div>
              <Label htmlFor="edit-due-date">Hạn chốt *</Label>
              <Input
                id="edit-due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-assigned-to">Người thực hiện (ID)</Label>
              <Input
                id="edit-assigned-to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Nhập ID người dùng..."
              />
            </div>

            <div>
              <Label htmlFor="edit-note">Ghi chú</Label>
              <Textarea
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập nhật
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
              Bạn có chắc chắn muốn xóa deadline này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
