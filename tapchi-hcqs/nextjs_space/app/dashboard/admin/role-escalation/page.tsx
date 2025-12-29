"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RoleEscalationRequest {
  id: string;
  userId: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    org?: string;
  };
  requester: {
    fullName: string;
    email: string;
  };
  approver?: {
    fullName: string;
    email: string;
  };
}

const roleLabels: Record<string, string> = {
  AUTHOR: 'Tác giả',
  REVIEWER: 'Phản biện',
  SECTION_EDITOR: 'Biên tập chuyên mục',
  MANAGING_EDITOR: 'Biên tập điều hành',
  EIC: 'Tổng biên tập',
  SYSADMIN: 'Quản trị hệ thống',
  SECURITY_AUDITOR: 'Kiểm toán viên',
};

const statusConfig = {
  PENDING: {
    label: 'Chờ duyệt',
    variant: 'default' as const,
    icon: Clock,
    color: 'text-blue-600',
  },
  APPROVED: {
    label: 'Đã duyệt',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  REJECTED: {
    label: 'Từ chối',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

export default function RoleEscalationManagementPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<RoleEscalationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RoleEscalationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RoleEscalationRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    // Filter requests based on status
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(
        requests.filter((req) => req.status === statusFilter)
      );
    }
  }, [statusFilter, requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/role-escalation');
      const data = await res.json();

      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error('Không thể tải danh sách yêu cầu');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessing(true);

      const res = await fetch('/api/admin/role-escalation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setShowActionDialog(false);
        setRejectionReason('');
        fetchRequests();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Lỗi khi xử lý yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (request: RoleEscalationRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setShowActionDialog(true);
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
            <ShieldCheck className="h-8 w-8 text-primary" />
            Quản lý nâng cấp quyền
          </h1>
          <p className="text-muted-foreground mt-2">
            Xem và duyệt các yêu cầu nâng cấp quyền của người dùng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Từ chối
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter((r) => r.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có yêu cầu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tổ chức</TableHead>
                    <TableHead>Quyền hiện tại</TableHead>
                    <TableHead>Quyền yêu cầu</TableHead>
                    <TableHead>Ngày yêu cầu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const StatusIcon = statusConfig[request.status].icon;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.user.fullName}
                        </TableCell>
                        <TableCell>{request.user.email}</TableCell>
                        <TableCell>{request.user.org || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {roleLabels[request.currentRole] || request.currentRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {roleLabels[request.requestedRole] || request.requestedRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.createdAt), 'dd/MM/yyyy', {
                            locale: vi,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[request.status].variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[request.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openActionDialog(request, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Duyệt
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openActionDialog(request, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Từ chối
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nâng quyền</DialogTitle>
            <DialogDescription>Thông tin chi tiết về yêu cầu</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Người yêu cầu</Label>
                  <p className="font-medium">{selectedRequest.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tổ chức</Label>
                  <p className="font-medium">{selectedRequest.user.org || 'Không có'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quyền hiện tại</Label>
                  <Badge variant="outline">
                    {roleLabels[selectedRequest.currentRole] || selectedRequest.currentRole}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Quyền yêu cầu</Label>
                  <Badge>
                    {roleLabels[selectedRequest.requestedRole] || selectedRequest.requestedRole}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Lý do yêu cầu</Label>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.reason}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Trạng thái</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig[selectedRequest.status].variant}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
              </div>
              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                <div>
                  <Label className="text-sm text-muted-foreground">Lý do từ chối</Label>
                  <p className="mt-1 p-3 bg-red-50 text-red-900 rounded-md">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}
              {selectedRequest.approver && (
                <div>
                  <Label className="text-sm text-muted-foreground">Người phê duyệt</Label>
                  <p className="font-medium">{selectedRequest.approver.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.approver.email}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Bạn có chắc chắn muốn duyệt yêu cầu nâng quyền này?'
                : 'Vui lòng nhập lý do từ chối'}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p>
                  <strong>Người dùng:</strong> {selectedRequest.user.fullName}
                </p>
                <p>
                  <strong>Quyền yêu cầu:</strong>{' '}
                  {roleLabels[selectedRequest.requestedRole] || selectedRequest.requestedRole}
                </p>
              </div>
              {actionType === 'reject' && (
                <div>
                  <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={4}
                    required
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={() =>
                selectedRequest &&
                handleAction(
                  selectedRequest.id,
                  actionType === 'approve' ? 'APPROVED' : 'REJECTED'
                )
              }
              disabled={
                processing ||
                (actionType === 'reject' && !rejectionReason.trim())
              }
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
