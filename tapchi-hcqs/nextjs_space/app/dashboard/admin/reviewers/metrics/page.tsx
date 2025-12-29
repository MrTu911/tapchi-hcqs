
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
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
  ResponsiveContainer
} from 'recharts';
import { Search, TrendingUp, TrendingDown, Award, Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewerMetrics {
  reviewerId: string;
  reviewerName: string;
  email: string;
  totalInvited: number;
  totalAccepted: number;
  totalDeclined: number;
  totalCompleted: number;
  acceptanceRate: number;
  completionRate: number;
  declineRate: number;
  avgCompletionDays: number;
  onTimeRate: number;
  avgQualityRating: number;
  recommendationDistribution: {
    ACCEPT: number;
    MINOR: number;
    MAJOR: number;
    REJECT: number;
  };
  currentLoad: number;
  maxLoad: number;
}

const RECOMMENDATION_COLORS = {
  ACCEPT: '#10b981',
  MINOR: '#3b82f6',
  MAJOR: '#f59e0b',
  REJECT: '#ef4444'
};

const RECOMMENDATION_LABELS = {
  ACCEPT: 'Chấp nhận',
  MINOR: 'Sửa nhỏ',
  MAJOR: 'Sửa lớn',
  REJECT: 'Từ chối'
};

export default function ReviewerMetricsPage() {
  const [allMetrics, setAllMetrics] = useState<ReviewerMetrics[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<ReviewerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<ReviewerMetrics | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allMetrics.filter(m =>
        m.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMetrics(filtered);
    } else {
      setFilteredMetrics(allMetrics);
    }
  }, [searchTerm, allMetrics]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/reviewers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      setAllMetrics(data.data.reviewers);
      setFilteredMetrics(data.data.reviewers);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceRating = (metrics: ReviewerMetrics): { label: string; color: string } => {
    const score = (metrics.avgQualityRating * 0.4) + 
                  (metrics.completionRate * 0.3) + 
                  (metrics.onTimeRate * 0.3);
    
    if (score >= 80) return { label: 'Xuất sắc', color: 'text-green-600' };
    if (score >= 60) return { label: 'Tốt', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Trung bình', color: 'text-yellow-600' };
    return { label: 'Cần cải thiện', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const topPerformers = [...allMetrics]
    .sort((a, b) => {
      const scoreA = (a.avgQualityRating * 0.4) + (a.completionRate * 0.3) + (a.onTimeRate * 0.3);
      const scoreB = (b.avgQualityRating * 0.4) + (b.completionRate * 0.3) + (b.onTimeRate * 0.3);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const avgMetrics = {
    completionRate: allMetrics.reduce((sum, m) => sum + m.completionRate, 0) / allMetrics.length || 0,
    avgDays: allMetrics.reduce((sum, m) => sum + m.avgCompletionDays, 0) / allMetrics.length || 0,
    onTimeRate: allMetrics.reduce((sum, m) => sum + m.onTimeRate, 0) / allMetrics.length || 0
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviewer Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Đánh giá hiệu suất và phân tích phản biện viên
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành TB</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMetrics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trung bình toàn hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian TB</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMetrics.avgDays.toFixed(0)} ngày</div>
            <p className="text-xs text-muted-foreground mt-1">
              Để hoàn tất phản biện
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đúng hạn TB</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMetrics.onTimeRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nộp đúng hoặc trước hạn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top 5 Phản biện viên xuất sắc
          </CardTitle>
          <CardDescription>Dựa trên chất lượng, completion rate và on-time rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((reviewer, index) => (
              <div key={reviewer.reviewerId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{reviewer.reviewerName}</div>
                    <div className="text-sm text-muted-foreground">{reviewer.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Rating: {reviewer.avgQualityRating.toFixed(1)}/5</div>
                    <div className="text-xs text-muted-foreground">
                      {reviewer.totalCompleted} reviews hoàn tất
                    </div>
                  </div>
                  <Badge variant="secondary">{getPerformanceRating(reviewer).label}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Reviewers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tất cả phản biện viên</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Badge variant="outline">{filteredMetrics.length} reviewers</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead className="text-center">Total Reviews</TableHead>
                  <TableHead className="text-center">Completion Rate</TableHead>
                  <TableHead className="text-center">Avg Days</TableHead>
                  <TableHead className="text-center">On-Time Rate</TableHead>
                  <TableHead className="text-center">Quality Rating</TableHead>
                  <TableHead className="text-center">Current Load</TableHead>
                  <TableHead className="text-center">Đánh giá</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetrics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Không tìm thấy reviewer nào
                    </TableCell>
                  </TableRow>
                )}
                {filteredMetrics.map((reviewer) => {
                  const rating = getPerformanceRating(reviewer);
                  return (
                    <TableRow key={reviewer.reviewerId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reviewer.reviewerName}</div>
                          <div className="text-xs text-muted-foreground">{reviewer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{reviewer.totalCompleted}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={reviewer.completionRate >= 80 ? 'default' : 'secondary'}>
                          {reviewer.completionRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{reviewer.avgCompletionDays.toFixed(0)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={reviewer.onTimeRate >= 70 ? 'default' : 'secondary'}>
                          {reviewer.onTimeRate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {reviewer.avgQualityRating > 0 ? (
                          <span className="font-medium">
                            {reviewer.avgQualityRating.toFixed(1)}/5
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={reviewer.currentLoad >= reviewer.maxLoad ? 'destructive' : 'outline'}
                        >
                          {reviewer.currentLoad}/{reviewer.maxLoad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={rating.color}>{rating.label}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReviewer(reviewer)}
                        >
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Modal/Dialog - simplified inline detail */}
      {selectedReviewer && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedReviewer.reviewerName}</CardTitle>
                <CardDescription>{selectedReviewer.email}</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedReviewer(null)}>Đóng</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Đã mời</div>
                    <div className="text-2xl font-bold">{selectedReviewer.totalInvited}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Chấp nhận</div>
                    <div className="text-2xl font-bold text-green-600">{selectedReviewer.totalAccepted}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Từ chối</div>
                    <div className="text-2xl font-bold text-red-600">{selectedReviewer.totalDeclined}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                    <div className="text-2xl font-bold">{selectedReviewer.acceptanceRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Decline Rate</div>
                    <div className="text-2xl font-bold">{selectedReviewer.declineRate.toFixed(1)}%</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(selectedReviewer.recommendationDistribution).map(([key, value]) => ({
                        name: RECOMMENDATION_LABELS[key as keyof typeof RECOMMENDATION_LABELS],
                        value
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {Object.keys(selectedReviewer.recommendationDistribution).map((key, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={RECOMMENDATION_COLORS[key as keyof typeof RECOMMENDATION_COLORS]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
