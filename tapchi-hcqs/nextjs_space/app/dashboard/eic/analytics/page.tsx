
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface EditorAnalytics {
  overview: {
    totalSubmissions: number;
    activeSubmissions: number;
    completedSubmissions: number;
    avgProcessingDays: number;
    acceptanceRate: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  timeline: Array<{
    month: string;
    submitted: number;
    accepted: number;
    rejected: number;
  }>;
  reviewerWorkload: {
    totalActiveReviewers: number;
    avgReviewsPerReviewer: number;
    overloadedReviewers: number;
  };
  performanceMetrics: {
    avgReviewTurnaroundDays: number;
    avgRevisionTurnaroundDays: number;
    avgTimeToDecision: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  DESK_REJECT: '#ef4444',
  UNDER_REVIEW: '#f59e0b',
  REVISION: '#8b5cf6',
  ACCEPTED: '#10b981',
  REJECTED: '#dc2626',
  IN_PRODUCTION: '#06b6d4',
  PUBLISHED: '#059669'
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới nộp',
  DESK_REJECT: 'Từ chối sơ bộ',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Yêu cầu sửa',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Sản xuất',
  PUBLISHED: 'Đã xuất bản'
};

export default function EICAnalyticsPage() {
  const [analytics, setAnalytics] = useState<EditorAnalytics | null>(null);
  const [trend, setTrend] = useState<Array<{ month: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/editor');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data.data.analytics);
      setTrend(data.data.trend);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Không thể tải dữ liệu analytics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Tổng quan và phân tích toàn hệ thống
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài nộp</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.activeSubmissions} đang xử lý
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ chấp nhận</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.overview.completedSubmissions} bài hoàn tất
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian xử lý TB</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.avgProcessingDays.toFixed(0)} ngày
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ nộp đến quyết định
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phản biện viên</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.reviewerWorkload.totalActiveReviewers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.reviewerWorkload.overloadedReviewers > 0 && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {analytics.reviewerWorkload.overloadedReviewers} quá tải
                </span>
              )}
              {analytics.reviewerWorkload.overloadedReviewers === 0 && 'Workload ổn định'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Xu hướng</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
          <TabsTrigger value="category">Chuyên mục</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
        </TabsList>

        {/* Timeline Chart */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Số lượng bài nộp theo tháng</CardTitle>
              <CardDescription>12 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Số bài nộp"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.byStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry: any) => STATUS_LABELS[entry.status as string] || entry.status}
                    >
                      {analytics.byStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: STATUS_COLORS[item.status] }}
                        />
                        <span className="text-sm font-medium">
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.count}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Category Distribution */}
        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>Bài nộp theo chuyên mục</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoryName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Số bài" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất xử lý</CardTitle>
                <CardDescription>Thời gian trung bình (ngày)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Phản biện</span>
                      <span className="text-2xl font-bold">
                        {analytics.performanceMetrics.avgReviewTurnaroundDays.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian từ mời đến hoàn tất phản biện
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Quyết định</span>
                      <span className="text-2xl font-bold">
                        {analytics.performanceMetrics.avgTimeToDecision.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Thời gian từ nộp đến quyết định cuối
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workload phản biện viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Tổng phản biện viên</span>
                      <span className="text-2xl font-bold">
                        {analytics.reviewerWorkload.totalActiveReviewers}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Trung bình review/người</span>
                      <span className="text-2xl font-bold">
                        {analytics.reviewerWorkload.avgReviewsPerReviewer.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {analytics.reviewerWorkload.overloadedReviewers > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {analytics.reviewerWorkload.overloadedReviewers} phản biện viên đang quá tải
                        </span>
                      </div>
                      <p className="text-xs text-orange-700 mt-1">
                        Cân nhắc phân phối lại workload hoặc tuyển thêm reviewer
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Timeline with decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng quyết định</CardTitle>
          <CardDescription>6 tháng gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="submitted" 
                stroke="#3b82f6" 
                name="Nộp"
              />
              <Line 
                type="monotone" 
                dataKey="accepted" 
                stroke="#10b981" 
                name="Chấp nhận"
              />
              <Line 
                type="monotone" 
                dataKey="rejected" 
                stroke="#ef4444" 
                name="Từ chối"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
