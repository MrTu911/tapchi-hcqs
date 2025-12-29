
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { toast } from 'sonner'
import { Edit, Hash, Eye, CheckCircle, AlertCircle, Search, Filter, FileText, Download, Sparkles, History, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { generateDOI } from '@/lib/validation/metadata'

interface Article {
  id: string
  pages?: string
  doiLocal?: string
  publishedAt?: string
  submission: {
    id: string
    code: string
    title: string
    author: {
      fullName: string
      email: string
    }
    category?: {
      id: string
      name: string
    }
  }
  issue?: {
    id: string
    number: number
    volume: {
      volumeNo: number
    }
  }
}

interface Issue {
  id: string
  number: number
  year: number
  volume: {
    volumeNo: number
  }
}

interface Category {
  id: string
  name: string
}

export default function ArticleManagementPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [issueFilter, setIssueFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // 20 items per page
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    pages: '',
    doiLocal: '',
    issueId: '',
    publishedAt: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterArticles()
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [searchQuery, statusFilter, categoryFilter, issueFilter, articles])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch articles
      const articlesRes = await fetch('/api/metadata')
      const articlesData = await articlesRes.json()
      if (articlesData.success) {
        setArticles(articlesData.data)
      }

      // Fetch issues
      const issuesRes = await fetch('/api/issues')
      const issuesData = await issuesRes.json()
      if (issuesData.success) {
        setIssues(issuesData.data)
      }

      // Fetch categories
      const categoriesRes = await fetch('/api/categories')
      const categoriesData = await categoriesRes.json()
      if (categoriesData.success) {
        setCategories(categoriesData.data)
      }

    } catch (error) {
      toast.error('Lỗi tải dữ liệu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = [...articles]

    // Search by title or author
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (article) =>
          article.submission.title.toLowerCase().includes(query) ||
          article.submission.author.fullName.toLowerCase().includes(query) ||
          article.submission.code.toLowerCase().includes(query)
      )
    }

    // Filter by DOI status
    if (statusFilter === 'with-doi') {
      filtered = filtered.filter((article) => article.doiLocal)
    } else if (statusFilter === 'without-doi') {
      filtered = filtered.filter((article) => !article.doiLocal)
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (article) => article.submission.category?.id === categoryFilter
      )
    }

    // Filter by issue
    if (issueFilter === 'assigned') {
      filtered = filtered.filter((article) => article.issue)
    } else if (issueFilter === 'unassigned') {
      filtered = filtered.filter((article) => !article.issue)
    } else if (issueFilter !== 'all') {
      filtered = filtered.filter((article) => article.issue?.id === issueFilter)
    }

    setFilteredArticles(filtered)
  }

  const handleEdit = (article: Article) => {
    setSelectedArticle(article)
    setFormData({
      pages: article.pages || '',
      doiLocal: article.doiLocal || '',
      issueId: article.issue?.id || '',
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().split('T')[0]
        : ''
    })
    setIsEditDialogOpen(true)
  }

  const handlePreview = (article: Article) => {
    setSelectedArticle(article)
    setIsPreviewDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedArticle) return

    try {
      const response = await fetch('/api/metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          ...formData,
          issueId: formData.issueId || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Cập nhật metadata thành công')
        setIsEditDialogOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi cập nhật metadata')
    }
  }

  const handleGenerateDOI = async (article: Article) => {
    if (!article.issue) {
      toast.error('Bài viết phải được phân công vào số tạp chí trước khi tạo DOI')
      return
    }

    try {
      const doi = generateDOI(article.id, article.issue.volume.volumeNo)
      
      const response = await fetch('/api/metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          doiLocal: doi
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`DOI tạo thành công: ${doi}`)
        fetchData()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi tạo DOI')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setIssueFilter('all')
    setCurrentPage(1)
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Quản lý Bài báo
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý metadata, DOI, và phân công bài viết vào số tạp chí
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Tìm kiếm & Lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tiêu đề, tác giả, mã bài..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Trạng thái DOI</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="with-doi">Có DOI</SelectItem>
                  <SelectItem value="without-doi">Chưa có DOI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Chuyên mục</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Filter */}
            <div className="space-y-2">
              <Label>Số tạp chí</Label>
              <Select value={issueFilter} onValueChange={setIssueFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="assigned">Đã phân công</SelectItem>
                  <SelectItem value="unassigned">Chưa phân công</SelectItem>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      Tập {issue.volume.volumeNo}, Số {issue.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị <strong>{startIndex + 1}-{Math.min(endIndex, filteredArticles.length)}</strong> / <strong>{filteredArticles.length}</strong> bài viết
              {filteredArticles.length !== articles.length && ` (lọc từ ${articles.length} bài)`}
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bài viết</CardTitle>
          <CardDescription>
            Quản lý thông tin xuất bản và metadata của các bài viết
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy bài viết phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã bài</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Chuyên mục</TableHead>
                    <TableHead>Số tạp chí</TableHead>
                    <TableHead>Trang</TableHead>
                    <TableHead>DOI</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-mono text-sm">
                        {article.submission.code}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <Link
                          href={`/articles/${article.id}`}
                          className="hover:underline font-medium line-clamp-2"
                          target="_blank"
                        >
                          {article.submission.title}
                        </Link>
                      </TableCell>
                      <TableCell>{article.submission.author.fullName}</TableCell>
                      <TableCell>
                        {article.submission.category?.name ? (
                          <Badge variant="outline">{article.submission.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {article.issue ? (
                          <Badge>
                            Tập {article.issue.volume.volumeNo}, Số {article.issue.number}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Chưa phân công</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {article.pages || '-'}
                      </TableCell>
                      <TableCell>
                        {article.doiLocal ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs font-mono">{article.doiLocal}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs">Chưa có</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(article)}
                            title="Chỉnh sửa metadata"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Link href={`/dashboard/admin/articles/${article.id}/versions`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Xem lịch sử phiên bản"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/admin/articles/${article.id}/review`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Kiểm duyệt bài báo"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!article.doiLocal && article.issue && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleGenerateDOI(article)}
                              title="Tự động tạo DOI"
                            >
                              <Sparkles className="h-4 w-4 mr-1" />
                              DOI
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(article)}
                            title="Xem trước"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        page === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Metadata</DialogTitle>
            <DialogDescription>
              Bài viết: <strong>{selectedArticle?.submission.code}</strong> - {selectedArticle?.submission.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="issueId">Số tạp chí</Label>
                <Select
                  value={formData.issueId}
                  onValueChange={(value) => setFormData({ ...formData, issueId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số tạp chí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không gán</SelectItem>
                    {issues.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        Tập {issue.volume.volumeNo}, Số {issue.number} - Năm {issue.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pages">Trang (pages)</Label>
                <Input
                  id="pages"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="1-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishedAt">Ngày xuất bản</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="doiLocal">DOI</Label>
                <Input
                  id="doiLocal"
                  value={formData.doiLocal}
                  onChange={(e) => setFormData({ ...formData, doiLocal: e.target.value })}
                  placeholder="10.5567/hcqs.2025.123"
                />
                <p className="text-xs text-muted-foreground">
                  Định dạng: 10.xxxxx/xxxxx hoặc để trống để tự động tạo
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit">Cập nhật</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước Metadata</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Mã bài</Label>
                <p className="font-mono text-lg">{selectedArticle.submission.code}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Tiêu đề</Label>
                <p className="text-lg font-semibold">{selectedArticle.submission.title}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Tác giả</Label>
                  <p>{selectedArticle.submission.author.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedArticle.submission.author.email}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Chuyên mục</Label>
                  <p>{selectedArticle.submission.category?.name || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Số tạp chí</Label>
                  {selectedArticle.issue ? (
                    <p>Tập {selectedArticle.issue.volume.volumeNo}, Số {selectedArticle.issue.number}</p>
                  ) : (
                    <p className="text-muted-foreground">Chưa phân công</p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Trang</Label>
                  <p>{selectedArticle.pages || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">DOI</Label>
                  <p className="font-mono text-sm">{selectedArticle.doiLocal || '-'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Ngày xuất bản</Label>
                  <p>
                    {selectedArticle.publishedAt
                      ? new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link
                  href={`/articles/${selectedArticle.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  Xem bài viết đầy đủ
                </Link>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

