'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Activity,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuditLog {
  id: string;
  actorId: string | null;
  actor?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  action: string;
  object: string;
  objectId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  before: any;
  after: any;
  metadata: any;
  createdAt: string;
}

interface AuditStats {
  total: number;
  byAction: { action: string; count: number }[];
  byUser: { actorId: string; count: number; user: any }[];
  recent: AuditLog[];
  period: { days: number; from: string; to: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Action categories for filtering
  const actionCategories = [
    { value: 'all', label: 'Tất cả hành động' },
    { value: 'LOGIN', label: 'Đăng nhập/Đăng xuất', prefix: 'LOGIN' },
    { value: 'USER', label: 'Quản lý người dùng', prefix: 'USER' },
    { value: 'SUBMISSION', label: 'Bài viết', prefix: 'SUBMISSION' },
    { value: 'REVIEW', label: 'Phản biện', prefix: 'REVIEW' },
    { value: 'ARTICLE', label: 'Xuất bản', prefix: 'ARTICLE' },
    { value: 'ISSUE', label: 'Số tạp chí', prefix: 'ISSUE' },
    { value: 'FILE', label: 'Truy cập file', prefix: 'FILE' },
    { value: 'SYSTEM', label: 'Hệ thống', prefix: 'SYSTEM' },
    { value: 'BACKUP', label: 'Sao lưu', prefix: 'BACKUP' },
  ];
  
  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (search) params.append('search', search);
      if (action !== 'all') {
        const category = actionCategories.find((c) => c.value === action);
        if (category?.prefix) {
          params.append('action', category.prefix);
        }
      }
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error('Không thể tải logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Lỗi khi tải audit logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/audit-logs/stats?days=30');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
  }, [page, action, dateFrom, dateTo]);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  // Get action color
  const getActionColor = (actionStr: string): string => {
    if (actionStr.includes('SUCCESS') || actionStr.includes('CREATED') || actionStr.includes('PUBLISHED')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionStr.includes('FAILED') || actionStr.includes('DENIED') || actionStr.includes('DELETED')) {
      return 'bg-red-100 text-red-800';
    }
    if (actionStr.includes('UPDATED') || actionStr.includes('CHANGED')) {
      return 'bg-blue-100 text-blue-800';
    }
    if (actionStr.includes('BACKUP') || actionStr.includes('RESTORE')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get action icon
  const getActionIcon = (actionStr: string) => {
    if (actionStr.includes('SUCCESS') || actionStr.includes('PUBLISHED')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (actionStr.includes('FAILED') || actionStr.includes('DENIED')) {
      return <XCircle className="w-4 h-4" />;
    }
    if (actionStr.includes('DELETED')) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4" />;
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          Nhật ký Kiểm toán
        </h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi và phân tích các hoạt động quan trọng trong hệ thống
        </p>
      </div>
      
      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng sự kiện (30 ngày)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Từ {format(new Date(stats.period.from), 'dd/MM', { locale: vi })}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hành động phổ biến nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byAction[0]?.action || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byAction[0]?.count || 0} lần
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Người dùng hoạt động nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">
                {stats.byUser[0]?.user?.fullName || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.byUser[0]?.count || 0} hành động
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cảnh báo quan trọng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.recent.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Sự kiện bảo mật
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm theo action, IP, object..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="action">Loại hành động</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={fetchLogs} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setAction('all');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhật ký ({logs.length} kết quả)</CardTitle>
          <CardDescription>
            Trang {page} / {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Không có nhật ký nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Đối tượng</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {getActionIcon(log.action)}
                          <span className="ml-1">{log.action}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.actor ? (
                          <div>
                            <div className="font-medium">{log.actor.fullName}</div>
                            <div className="text-xs text-muted-foreground">{log.actor.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={log.object}>
                          {log.object}
                        </div>
                        {log.objectId && (
                          <div className="text-xs text-muted-foreground truncate" title={log.objectId}>
                            ID: {log.objectId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Chi tiết nhật ký
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Thời gian:</span>
                      <div className="font-mono text-xs mt-1">
                        {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Hành động:</span>
                      <div className="mt-1">
                        <Badge className={getActionColor(selectedLog.action)}>
                          {selectedLog.action}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Người thực hiện:</span>
                      <div className="mt-1">
                        {selectedLog.actor ? (
                          <>
                            <div>{selectedLog.actor.fullName}</div>
                            <div className="text-xs text-muted-foreground">{selectedLog.actor.email}</div>
                            <div className="text-xs text-muted-foreground">Role: {selectedLog.actor.role}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">System</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Đối tượng:</span>
                      <div className="mt-1">
                        <div>{selectedLog.object}</div>
                        {selectedLog.objectId && (
                          <div className="text-xs text-muted-foreground font-mono">ID: {selectedLog.objectId}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">IP Address:</span>
                      <div className="font-mono text-xs mt-1">{selectedLog.ipAddress || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium">User Agent:</span>
                      <div className="text-xs mt-1 truncate" title={selectedLog.userAgent || 'N/A'}>
                        {selectedLog.userAgent || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Before/After */}
              {(selectedLog.before || selectedLog.after) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Thay đổi dữ liệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLog.before && (
                        <div>
                          <div className="font-medium text-sm mb-2">Trước khi thay đổi:</div>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(selectedLog.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.after && (
                        <div>
                          <div className="font-medium text-sm mb-2">Sau khi thay đổi:</div>
                          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                            {JSON.stringify(selectedLog.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Metadata */}
              {selectedLog.metadata && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
