'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  FileText, CheckCircle, Clock, BookOpen, Bell, PlusCircle, 
  Loader2, Edit3, Eye, Trash2, Download, TrendingUp,
  MessageSquare, Lightbulb, Settings, Calendar
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import Link from 'next/link'

const COLORS = ['#60A5FA', '#FBBF24', '#F97316', '#34D399', '#EF4444', '#8B5CF6', '#A78BFA']

export default function AuthorDashboardPage() {
  const { data: session, status } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentArticles, setRecentArticles] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/author/statistics')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentArticles(data.recentSubmissions)
        setChartData(data.chartData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; color: string }> = {
      'NEW': { label: 'Bản nháp', variant: 'secondary', color: 'bg-slate-500' },
      'UNDER_REVIEW': { label: 'Đang phản biện', variant: 'default', color: 'bg-yellow-500' },
      'REVISION': { label: 'Cần chỉnh sửa', variant: 'outline', color: 'bg-orange-500' },
      'ACCEPTED': { label: 'Đã chấp nhận', variant: 'success', color: 'bg-green-500' },
      'REJECTED': { label: 'Từ chối', variant: 'destructive', color: 'bg-red-500' },
      'DESK_REJECT': { label: 'Từ chối sơ bộ', variant: 'destructive', color: 'bg-red-600' },
      'IN_PRODUCTION': { label: 'Đang xuất bản', variant: 'secondary', color: 'bg-purple-500' },
      'PUBLISHED': { label: 'Đã xuất bản', variant: 'default', color: 'bg-blue-500' }
    }
    return statusMap[status] || { label: status, variant: 'default', color: 'bg-gray-500' }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Chào buổi sáng', icon: '☀️' }
    if (hour < 18) return { text: 'Chào buổi chiều', icon: '🌤️' }
    return { text: 'Chào buổi tối', icon: '🌙' }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const greeting = getGreeting()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      {/* Header Bar */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {greeting.icon} {greeting.text}, {(session as any)?.fullName || 'Tác giả'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý bài viết và theo dõi tiến trình xuất bản của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Link href="/dashboard/author/submit" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> 
              Tạo bài mới
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="relative hover:bg-accent transition-all duration-300"
            asChild
          >
            <Link href="/dashboard/author/notifications">
              <Bell className="w-4 h-4" />
              {stats?.totalReviews > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.totalReviews > 9 ? '9+' : stats.totalReviews}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </motion.header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { 
            title: 'Tổng bài viết', 
            value: stats?.total || 0, 
            icon: FileText, 
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            description: 'Tất cả bài nộp'
          },
          { 
            title: 'Đang phản biện', 
            value: stats?.underReview || 0, 
            icon: Clock, 
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            description: 'Đang được xem xét'
          },
          { 
            title: 'Đã chấp nhận', 
            value: stats?.accepted || 0, 
            icon: CheckCircle, 
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            description: 'Được duyệt xuất bản'
          },
          { 
            title: 'Đã xuất bản', 
            value: stats?.published || 0, 
            icon: BookOpen, 
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            description: 'Công khai trên tạp chí'
          },
        ].map((card, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <Card className={`${card.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} shadow-md`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br ${card.color} bg-clip-text text-transparent">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Article Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Phân bố trạng thái bài viết
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có dữ liệu</p>
                  </div>
                </div>
              )}
              {stats && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-2xl font-bold text-blue-600">{stats.acceptanceRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Tỷ lệ chấp nhận</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalReviews}</p>
                    <p className="text-xs text-muted-foreground mt-1">Phản biện nhận được</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 col-span-2 md:col-span-1">
                    <p className="text-2xl font-bold text-green-600">{stats.inProduction}</p>
                    <p className="text-xs text-muted-foreground mt-1">Đang xuất bản</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Advanced Features */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start hover:bg-white dark:hover:bg-slate-800 transition-all">
                <Link href="/dashboard/author/articles">
                  <FileText className="w-4 h-4 mr-2" />
                  Bài viết của tôi
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start hover:bg-white dark:hover:bg-slate-800 transition-all">
                <Link href="/dashboard/author/submissions">
                  <Calendar className="w-4 h-4 mr-2" />
                  Tiến trình phản biện
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start hover:bg-white dark:hover:bg-slate-800 transition-all">
                <Link href="/dashboard/author/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt cá nhân
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Features */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Tính năng nâng cao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p><strong>Nhận xét phản biện:</strong> Xem phản hồi inline trong PDF</p>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p><strong>AI Gợi ý:</strong> Đề xuất tiêu đề và từ khóa</p>
              </div>
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p><strong>Xuất báo cáo:</strong> Tải bản PDF/Word preview</p>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p><strong>Lịch phản biện:</strong> Theo dõi tiến độ chi tiết</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bài viết gần đây</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/author/articles">
                Xem tất cả
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Chưa có bài viết nào</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Bắt đầu hành trình xuất bản của bạn ngay hôm nay
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Link href="/dashboard/author/submit">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Tạo bài viết đầu tiên
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article, index) => {
                  const statusInfo = getStatusBadge(article.status)
                  return (
                    <motion.div
                      key={article.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {article.title}
                            </h3>
                            <Badge variant={statusInfo.variant} className="flex-shrink-0">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                            {article.category && (
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                                {article.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/dashboard/author/articles/${article.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
