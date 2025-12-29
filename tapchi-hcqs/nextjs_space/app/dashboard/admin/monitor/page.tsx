'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  FileText,
  BookOpen,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Database,
  Shield,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MonitorData {
  users: {
    total: number;
    active: number;
    byRole: { role: string; count: number }[];
    newThisMonth: number;
  };
  submissions: {
    total: number;
    byStatus: { status: string; count: number }[];
    thisMonth: number;
    trend: { month: string; count: number }[];
  };
  articles: {
    total: number;
    thisMonth: number;
    byCategory: { categoryId: number; categoryName: string; count: number }[];
  };
  issues: {
    total: number;
    published: number;
  };
  reviews: {
    total: number;
    pending: number;
    completed: number;
  };
  system: {
    auditLogs: number;
    recentActivity: any[];
  };
  period: {
    days: number;
    from: string;
    to: string;
  };
}

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  muted: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: COLORS.info,
  UNDER_REVIEW: COLORS.warning,
  ACCEPTED: COLORS.primary,
  REJECTED: COLORS.danger,
  REVISION: COLORS.secondary,
  PUBLISHED: COLORS.primary,
};

export default function MonitorDashboard() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/monitor?days=30');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastRefresh(new Date());
      } else {
        toast.error('Không thể tải dữ liệu monitoring');
      }
    } catch (error) {
      console.error('Error fetching monitor data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading || !data) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Giám sát Hệ thống
          </h1>
          <p className="text-muted-foreground mt-1">
            Tổng quan và thống kê hoạt động hệ thống
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Cập nhật: {format(lastRefresh, 'HH:mm:ss dd/MM/yyyy', { locale: vi })}
          </div>
          <Button onClick={fetchData} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tổng người dùng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.users.total}</div>
            <div className="text-sm text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline text-green-600" />
              {data.users.newThisMonth} mới tháng này
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Hoạt động: {data.users.active}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Submissions */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bài viết gửi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.submissions.total}</div>
            <div className="text-sm text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline text-green-600" />
              {data.submissions.thisMonth} tháng này
            </div>
          </CardContent>
        </Card>
        
        {/* Total Articles */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Bài đã xuất bản
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.articles.total}</div>
            <div className="text-sm text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline text-green-600" />
              {data.articles.thisMonth} tháng này
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Reviews */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Phản biện chờ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{data.reviews.pending}</div>
            <div className="text-sm text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline text-green-600" />
              {data.reviews.completed} hoàn thành
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tổng: {data.reviews.total}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Xu hướng bài viết (6 tháng)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.submissions.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Số bài viết"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Submissions by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Trạng thái bài viết
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.submissions.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Số lượng">
                  {data.submissions.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Người dùng theo vai trò
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.users.byRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.users.byRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Articles by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Bài viết theo chuyên mục (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.articles.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="categoryName" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS.primary} name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Số tạp chí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.issues.published}</div>
            <div className="text-sm text-muted-foreground">
              Đã xuất bản / {data.issues.total} tổng
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Nhật ký kiểm toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system.auditLogs}</div>
            <div className="text-sm text-muted-foreground">
              Sự kiện (30 ngày)
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Hoạt động gần đây
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.system.recentActivity.length}</div>
            <div className="text-sm text-muted-foreground">
              Sự kiện mới nhất
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Hoạt động gần đây
          </CardTitle>
          <CardDescription>
            10 sự kiện mới nhất trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.system.recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.actor?.fullName || 'System'} - {activity.object}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(activity.createdAt), 'HH:mm dd/MM', { locale: vi })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Health Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Trạng thái hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Database</div>
              <Badge className="mt-1 bg-green-100 text-green-800">Kết nối</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">API</div>
              <Badge className="mt-1 bg-green-100 text-green-800">Hoạt động</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Storage</div>
              <Badge className="mt-1 bg-green-100 text-green-800">Sẵn sàng</Badge>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Backup</div>
              <Badge className="mt-1 bg-green-100 text-green-800">Ổn định</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
