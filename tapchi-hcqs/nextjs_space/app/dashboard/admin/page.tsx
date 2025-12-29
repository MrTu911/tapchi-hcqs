'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardStats {
  overview: {
    totalUsers: number
    totalSubmissions: number
    totalIssues: number
    publishedIssues: number
    totalArticles: number
    activeReviewers: number
    totalReviews: number
    completedReviews: number
    pendingReviews: number
    acceptanceRate: string
    reviewCompletionRate: string
  }
  charts: {
    usersByRole: Array<{ role: string; count: number }>
    submissionsByStatus: Array<{ status: string; count: number }>
  }
  recentLogs: Array<{
    id: string
    actor: string
    actorRole?: string
    action: string
    object: string
    createdAt: Date
  }>
  newUsers: Array<{
    id: string
    fullName: string
    email: string
    role: string
    createdAt: Date
  }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-amber-500" />
          <p className="text-slate-600 dark:text-military-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-400 dark:via-amber-500 dark:to-amber-600 bg-clip-text text-transparent">
          Dashboard Quản trị
        </h1>
        <p className="text-slate-600 dark:text-military-300 mt-2 font-medium">
          Tổng quan toàn hệ thống trong 10 giây đầu tiên ⚡
        </p>
      </div>

      {/* Stats Cards - Military Theme */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Users */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Người dùng</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-white mb-1">{stats.overview.totalUsers}</div>
            <p className="text-xs text-blue-100 font-medium">Tổng số người dùng</p>
          </CardContent>
        </Card>

        {/* Card 2: Articles */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Bài báo</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-white mb-1">{stats.overview.totalSubmissions}</div>
            <p className="text-xs text-emerald-100 font-medium">Tổng bài nộp ({stats.overview.acceptanceRate}% chấp nhận)</p>
          </CardContent>
        </Card>

        {/* Card 3: Reviewers */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Phản biện</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-white mb-1">{stats.overview.activeReviewers}</div>
            <p className="text-xs text-amber-100 font-medium">Hoạt động trong 30 ngày</p>
          </CardContent>
        </Card>

        {/* Card 4: Issues */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide">Số báo</CardTitle>
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-white mb-1">{stats.overview.publishedIssues}</div>
            <p className="text-xs text-purple-100 font-medium">Đã xuất bản ({stats.overview.totalIssues} tổng)</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Users by Role */}
        <Card className="border-military-700/20 dark:border-military-700/50 bg-white dark:bg-military-900/50">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Người dùng theo vai trò</CardTitle>
            <CardDescription className="text-slate-600 dark:text-military-400">Phân bổ vai trò trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.charts.usersByRole}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="role" 
                  className="fill-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => getRoleLabel(value)}
                />
                <YAxis className="fill-foreground" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: any) => [value, 'Số lượng']}
                  labelFormatter={(label) => getRoleLabel(label)}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Submissions by Status */}
        <Card className="border-military-700/20 dark:border-military-700/50 bg-white dark:bg-military-900/50">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Trạng thái bài báo</CardTitle>
            <CardDescription className="text-slate-600 dark:text-military-400">Phân bổ theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.charts.submissionsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }: any) => `${getStatusLabel(status as string)}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.charts.submissionsByStatus.map((entry, index) => (
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
                  formatter={(value: any, name: any) => [value, 'Số lượng']}
                  labelFormatter={(label) => getStatusLabel(label)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Logs */}
        <Card className="border-military-700/20 dark:border-military-700/50 bg-white dark:bg-military-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Hoạt động gần đây
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-military-400">10 thao tác mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-military-700 scrollbar-track-transparent">
              {stats.recentLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-military-700/20 dark:border-military-700/50 bg-slate-50 dark:bg-military-800/30 hover:bg-slate-100 dark:hover:bg-military-800/50 transition-all"
                >
                  <div className="mt-1">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                      {log.actor} 
                      {log.actorRole && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-amber-600 text-amber-700 dark:text-amber-400">
                          {getRoleLabel(log.actorRole)}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{log.action}</p>
                    <p className="text-xs text-slate-600 dark:text-military-400 mt-0.5">{log.object}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-military-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Users */}
        <Card className="border-military-700/20 dark:border-military-700/50 bg-white dark:bg-military-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Người dùng mới
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-military-400">5 người dùng mới nhất (30 ngày)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.newUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-military-700/20 dark:border-military-700/50 bg-slate-50 dark:bg-military-800/30 hover:bg-slate-100 dark:hover:bg-military-800/50 transition-all"
                >
                  <Avatar className="h-10 w-10 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/20">
                    <AvatarFallback className="bg-transparent text-military-900 font-bold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-900 dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-slate-600 dark:text-military-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs border-amber-600 text-amber-700 dark:text-amber-400">
                      {getRoleLabel(user.role)}
                    </Badge>
                    <p className="text-[10px] text-slate-500 dark:text-military-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </p>
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
