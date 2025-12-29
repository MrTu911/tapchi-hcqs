
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, Filter, Star, Upload, X } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export default function ArticlesManagementPage() {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'issue' | 'featured' | null>(null)
  const [bulkIssueId, setBulkIssueId] = useState('')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20) // 20 items per page
  
  const [filters, setFilters] = useState({
    search: '',
    categoryId: 'all',
    issueId: 'all',
    year: 'all',
    featured: 'all'
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }, [filters])

  const loadData = async () => {
    try {
      const [articlesRes, categoriesRes, issuesRes] = await Promise.all([
        fetch('/api/articles?limit=100').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/issues').then(r => r.json())
      ])

      setArticles(articlesRes.data?.articles || [])
      setCategories(categoriesRes.data || [])
      setIssues(issuesRes.issues || [])
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelected(newSelected)
  }

  const toggleSelectAll = () => {
    if (selected.size === filteredArticles.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredArticles.map(a => a.id)))
    }
  }

  const handleBulkAssignIssue = async () => {
    if (!bulkIssueId || selected.size === 0) return

    try {
      await Promise.all(
        Array.from(selected).map(articleId =>
          fetch(`/api/articles/${articleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issueId: bulkIssueId })
          })
        )
      )

      toast.success(`Đã gán ${selected.size} bài viết vào số tạp chí`)
      setShowBulkDialog(false)
      setSelected(new Set())
      setBulkIssueId('')
      loadData()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const handleBulkToggleFeatured = async (featured: boolean) => {
    if (selected.size === 0) return

    try {
      await Promise.all(
        Array.from(selected).map(articleId =>
          fetch(`/api/articles/${articleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFeatured: featured })
          })
        )
      )

      toast.success(`Đã cập nhật ${selected.size} bài viết`)
      setShowBulkDialog(false)
      setSelected(new Set())
      loadData()
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  const filteredArticles = articles.filter(article => {
    if (filters.search && !article.submission.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.categoryId !== 'all' && article.submission.categoryId !== filters.categoryId) {
      return false
    }
    if (filters.issueId !== 'all' && article.issueId !== filters.issueId) {
      return false
    }
    if (filters.year !== 'all' && article.issue?.year?.toString() !== filters.year) {
      return false
    }
    if (filters.featured === 'yes' && !article.isFeatured) {
      return false
    }
    if (filters.featured === 'no' && article.isFeatured) {
      return false
    }
    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 7
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  const years = Array.from(new Set(articles.map(a => a.issue?.year).filter(Boolean))).sort((a, b) => b - a)

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả bài viết đã xuất bản
          </p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} đã chọn
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkAction('issue')
                setShowBulkDialog(true)
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Gán vào số
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkAction('featured')
                setShowBulkDialog(true)
              }}
            >
              <Star className="mr-2 h-4 w-4" />
              Nổi bật
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tiêu đề bài viết..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chuyên mục</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
              >
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

            <div className="space-y-2">
              <Label>Số tạp chí</Label>
              <Select
                value={filters.issueId}
                onValueChange={(value) => setFilters({ ...filters, issueId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="null">Chưa gán</SelectItem>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.volume?.volumeNo && `Tập ${issue.volume.volumeNo}, `}Số {issue.number} ({issue.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Năm</Label>
              <Select
                value={filters.year}
                onValueChange={(value) => setFilters({ ...filters, year: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nổi bật</Label>
              <Select
                value={filters.featured}
                onValueChange={(value) => setFilters({ ...filters, featured: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="yes">Có</SelectItem>
                  <SelectItem value="no">Không</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách bài viết ({filteredArticles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy bài viết nào
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-2 px-3 border-b font-medium text-sm">
                <Checkbox
                  checked={selected.size === filteredArticles.length && filteredArticles.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-5">Tiêu đề</div>
                  <div className="col-span-2">Tác giả</div>
                  <div className="col-span-2">Chuyên mục</div>
                  <div className="col-span-2">Số TK</div>
                  <div className="col-span-1 text-center">Nổi bật</div>
                </div>
              </div>

              {paginatedArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-3 py-3 px-3 border rounded hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selected.has(article.id)}
                    onCheckedChange={() => toggleSelect(article.id)}
                  />
                  <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5">
                      <Link
                        href={`/articles/${article.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {article.submission.title}
                      </Link>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {article.submission.author.fullName}
                    </div>
                    <div className="col-span-2">
                      {article.submission.category && (
                        <Badge variant="outline" className="text-xs">
                          {article.submission.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2 text-sm">
                      {article.issue ? (
                        <span>
                          {article.issue.volume?.volumeNo && `Tập ${article.issue.volume.volumeNo}, `}
                          Số {article.issue.number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Chưa gán</span>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {article.isFeatured && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 pb-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        typeof page === 'string' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
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
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'issue' ? 'Gán vào số tạp chí' : 'Đánh dấu nổi bật'}
            </DialogTitle>
            <DialogDescription>
              Áp dụng thay đổi cho {selected.size} bài viết đã chọn
            </DialogDescription>
          </DialogHeader>

          {bulkAction === 'issue' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Chọn số tạp chí</Label>
                <Select value={bulkIssueId} onValueChange={setBulkIssueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn số" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {issue.volume?.volumeNo && `Tập ${issue.volume.volumeNo}, `}
                        Số {issue.number} ({issue.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Chọn hành động:
              </p>
            </div>
          )}

          <DialogFooter>
            {bulkAction === 'issue' ? (
              <Button onClick={handleBulkAssignIssue} disabled={!bulkIssueId}>
                Gán vào số
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => handleBulkToggleFeatured(true)}>
                  Đánh dấu nổi bật
                </Button>
                <Button variant="outline" onClick={() => handleBulkToggleFeatured(false)}>
                  Bỏ nổi bật
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
