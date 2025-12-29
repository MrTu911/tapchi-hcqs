
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, Users, FileText, UserCheck, TrendingUp, 
  Activity, Clock, Target, ExternalLink, Loader2
} from 'lucide-react'
import { 
  Bar, BarChart, Line, LineChart, Pie, PieChart, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts'
import { toast } from 'sonner'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface BasicStats {
  totalUsers: number
  totalSubmissions: number
  totalReviewers: number
  activeReviewers: number
  avgReviewDays: number
  submissionsByMonth: Array<{ month: string; count: number }>
  submissionsByStatus: Array<{ status: string; count: number }>
  usersByRole: Array<{ role: string; count: number }>
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<BasicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchBasicStats()
  }, [])

  const fetchBasicStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/statistics/overview')
      const data = await response.json()
      
      if (data.success || data) {
        setStats(data.data || data)
      } else {
        toast.error('Không thể tải thống kê')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Lỗi khi tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không có dữ liệu thống kê</p>
      </div>
    )
  }

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      'AUTHOR': 'Tác giả',
      'REVIEWER': 'Phản biện',
      'SECTION_EDITOR': 'Biên tập',
      'MANAGING_EDITOR': 'Thư ký',
      'EIC': 'Tổng biên tập',
      'SYSADMIN': 'Admin'
    }
    return map[role] || role
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'NEW': 'Mới',
      'UNDER_REVIEW': 'Đang duyệt',
      'REVISION': 'Sửa lại',
      'ACCEPTED': 'Chấp nhận',
      'REJECTED': 'Từ chối',
      'PUBLISHED': 'Xuất bản'
    }
    return map[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Thống kê hệ thống
          </h1>
          <p className="text-muted-foreground mt-1">
            Tổng quan các chỉ số quan trọng
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/admin/analytics')}
          variant="outline"
        >
          Xem Analytics chi tiết
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Toàn hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng bài nộp</CardTitle>
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả thời gian
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviewers hoạt động</CardTitle>
            <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeReviewers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              /{stats.totalReviewers} tổng số
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thời gian xử lý TB</CardTitle>
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgReviewDays.toFixed(0)} ngày</div>
            <p className="text-xs text-muted-foreground mt-1">
              Từ nộp đến quyết định
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">Bài nộp</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        {/* Submissions by Month */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Bài nộp theo tháng</CardTitle>
              <CardDescription>6 tháng gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.submissionsByMonth?.slice(-6) || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="fill-foreground" />
                  <YAxis className="fill-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Số bài" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions by Status */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố theo trạng thái</CardTitle>
              <CardDescription>Tất cả bài nộp</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={stats.submissionsByStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }: any) => 
                      `${getStatusLabel(status)}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    dataKey="count"
                  >
                    {(stats.submissionsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any) => [value, 'Số bài']}
                    labelFormatter={(label) => getStatusLabel(label)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users by Role */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố vai trò</CardTitle>
              <CardDescription>Cơ cấu người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.usersByRole || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="role" 
                    className="fill-foreground"
                    tickFormatter={(value) => getRoleLabel(value)}
                  />
                  <YAxis className="fill-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: any) => [value, 'Số người']}
                    labelFormatter={(label) => getRoleLabel(label)}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Số người" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Mẹo:</strong> Để xem phân tích chi tiết hơn với AI insights, reviewer performance, 
            workflow bottlenecks và nhiều thống kê khác, hãy truy cập trang{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => router.push('/dashboard/admin/analytics')}
            >
              Analytics →
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
