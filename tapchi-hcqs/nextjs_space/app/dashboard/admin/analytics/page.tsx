'use client'

import { useEffect, useState } from 'react'
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
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FileText,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Eye,
  Download,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DashboardSummary {
  submissions: {
    total: number
    new: number
    underReview: number
    accepted: number
    rejected: number
    published: number
    byStatus: Array<{
      status: string
      count: number
      label: string
    }>
  }
  users: {
    total: number
    pending: number
    activeAuthors: number
    activeReviewers: number
  }
  reviews: {
    total: number
    pending: number
    completed: number
    completionRate: string
  }
  issues: {
    total: number
    published: number
    draft: number
  }
  articles: {
    total: number
  }
  recentActivity: {
    submissions: Array<any>
    reviews: Array<any>
  }
  trends: {
    submissions: Array<{ month: string; count: number }>
  }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/dashboard/summary')
      const data = await res.json()
      if (data.success) {
        setSummary(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-emerald-500" />
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Không thể tải dữ liệu thống kê</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thống kê & Phân tích</h1>
        <p className="text-gray-600 mt-2">Tổng quan hoạt động và xu hướng của tạp chí</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Submissions */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 opacity-80" />
              <TrendingUp className="h-5 w-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary.submissions.total}</div>
            <div className="text-sm opacity-90">Tổng bài nộp</div>
            <div className="mt-2 text-xs opacity-75">
              <span className="font-semibold">{summary.submissions.new}</span> bài mới
            </div>
          </CardContent>
        </Card>

        {/* Published */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 opacity-80" />
              <BookOpen className="h-5 w-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary.submissions.published}</div>
            <div className="text-sm opacity-90">Đã xuất bản</div>
            <div className="mt-2 text-xs opacity-75">
              <span className="font-semibold">{summary.issues.published}</span> số tạp chí
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 opacity-80" />
              <Activity className="h-5 w-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary.users.total}</div>
            <div className="text-sm opacity-90">Người dùng</div>
            <div className="mt-2 text-xs opacity-75">
              <span className="font-semibold">{summary.users.pending}</span> chờ duyệt
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-8 w-8 opacity-80" />
              <Clock className="h-5 w-5 opacity-60" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary.reviews.total}</div>
            <div className="text-sm opacity-90">Phản biện</div>
            <div className="mt-2 text-xs opacity-75">
              <span className="font-semibold">{summary.reviews.completionRate}%</span> hoàn thành
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submission Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố trạng thái bài nộp</CardTitle>
            <CardDescription>Tỷ lệ các trạng thái hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary.submissions.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.label}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {summary.submissions.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submission Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo trạng thái</CardTitle>
            <CardDescription>Số lượng bài nộp từng trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.submissions.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submission Trends */}
        {summary.trends.submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng nộp bài</CardTitle>
              <CardDescription>6 tháng gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={summary.trends.submissions.map((item: any) => ({
                    ...item,
                    month: format(new Date(item.month), 'MM/yyyy', { locale: vi }),
                    count: Number(item.count),
                  }))}
                >
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
        )}

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan nhanh</CardTitle>
            <CardDescription>Các chỉ số quan trọng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Đang phản biện</span>
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {summary.submissions.underReview}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium">Đã chấp nhận</span>
                </div>
                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                  {summary.submissions.accepted}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <span className="font-medium">Bị từ chối</span>
                </div>
                <Badge variant="outline" className="text-rose-700 border-rose-300">
                  {summary.submissions.rejected}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-violet-600" />
                  <span className="font-medium">Phản biện viên</span>
                </div>
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  {summary.users.activeReviewers}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Tổng số tạp chí</span>
                </div>
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  {summary.issues.total}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Bài nộp gần đây</CardTitle>
            <CardDescription>5 bài mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentActivity.submissions.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/dashboard/admin/submissions/${sub.id}`}
                  className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                        {sub.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {sub.author.fullName} • {format(new Date(sub.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">{sub.code}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Phản biện gần đây</CardTitle>
            <CardDescription>5 phản biện mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentActivity.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg border bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                        {review.submission.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Vòng {review.roundNo} • {format(new Date(review.submittedAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant={review.recommendation === 'ACCEPT' ? 'default' : 'secondary'}
                    >
                      {review.recommendation}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
