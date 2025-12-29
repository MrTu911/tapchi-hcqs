
'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'
import { 
  FileText, Search, Filter, Eye, Edit3, Trash2, 
  PlusCircle, Loader2, ArrowUpDown, Download
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function MyArticlesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  useEffect(() => {
    fetchArticles()
  }, [filters, pagination.page])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      const response = await fetch(`/api/author/articles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Không thể tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handleStatusFilter = (value: string) => {
    setFilters({ ...filters, status: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handleSort = (sortBy: string) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    setFilters({ ...filters, sortBy, sortOrder: newOrder })
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return

    try {
      const response = await fetch(`/api/author/articles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Đã xóa bài viết thành công')
        fetchArticles()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Không thể xóa bài viết')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Đã xảy ra lỗi khi xóa bài viết')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bài viết của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và theo dõi tất cả bài viết của bạn
          </p>
        </div>
        <Button 
          asChild
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
        >
          <Link href="/dashboard/author/editor/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Tạo bài mới
          </Link>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, từ khóa..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="NEW">Bản nháp</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Đang phản biện</SelectItem>
                  <SelectItem value="REVISION">Cần chỉnh sửa</SelectItem>
                  <SelectItem value="ACCEPTED">Đã chấp nhận</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                  <SelectItem value="IN_PRODUCTION">Đang xuất bản</SelectItem>
                  <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Cập nhật gần nhất</SelectItem>
                  <SelectItem value="createdAt">Tạo gần nhất</SelectItem>
                  <SelectItem value="title">Tiêu đề</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Articles List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Không tìm thấy bài viết nào</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {filters.search || filters.status !== 'all' 
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Bắt đầu tạo bài viết đầu tiên của bạn'}
                </p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Link href="/dashboard/author/editor/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Tạo bài viết mới
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => {
                  const statusInfo = getStatusBadge(article.status)
                  const canEdit = ['NEW', 'REVISION'].includes(article.status)
                  const canDelete = article.status === 'NEW'

                  return (
                    <motion.div
                      key={article.id}
                      whileHover={{ scale: 1.005, x: 4 }}
                      className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {article.title}
                            </h3>
                            <Badge variant={statusInfo.variant} className="flex-shrink-0">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          {article.abstract && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {article.abstract}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>Mã: {article.code}</span>
                            {article.category && (
                              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                                {article.category.name}
                              </span>
                            )}
                            <span>
                              Cập nhật: {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                            {article.reviews.length > 0 && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {article.reviews.length} phản biện
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/author/articles/${article.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Xem
                            </Link>
                          </Button>
                          
                          {canEdit && (
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/author/editor/${article.id}`}>
                                <Edit3 className="w-4 h-4 mr-1" />
                                Sửa
                              </Link>
                            </Button>
                          )}

                          {article.manuscriptFile && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={article.manuscriptFile} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}

                          {canDelete && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(article.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && articles.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} bài viết
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={pagination.page === page ? 'default' : 'outline'}
                          onClick={() => setPagination({ ...pagination, page })}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
