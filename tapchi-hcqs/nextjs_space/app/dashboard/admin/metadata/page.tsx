
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Edit, Hash, Eye, CheckCircle, AlertCircle, Search, Filter, X, Download } from 'lucide-react'

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

export default function MetadataManagerPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [formData, setFormData] = useState({
    pages: '',
    doiLocal: '',
    issueId: '',
    publishedAt: ''
  })
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterIssue, setFilterIssue] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchArticles()
    fetchIssues()
  }, [])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/metadata')
      const data = await response.json()
      if (data.success) {
        setArticles(data.data)
      }
    } catch (error) {
      toast.error('Lỗi tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/issues')
      const data = await response.json()
      if (data.success) {
        setIssues(data.data)
      }
    } catch (error) {
      console.error('Lỗi tải issues:', error)
    }
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
        fetchArticles()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi cập nhật metadata')
    }
  }

  const handleGenerateDOI = async (articleId: string) => {
    try {
      const response = await fetch('/api/metadata/generate-doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`DOI tạo thành công: ${data.doi}`)
        fetchArticles()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi tạo DOI')
    }
  }

  const handleAssignIssue = async (submissionId: string, issueId: string) => {
    try {
      const response = await fetch(`/api/articles/${submissionId}/assign-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Phân công số tạp chí thành công')
        fetchArticles()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi phân công')
    }
  }

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>()
    articles.forEach(article => {
      if (article.submission.category?.name) {
        cats.add(article.submission.category.name)
      }
    })
    return Array.from(cats).sort()
  }, [articles])

  // Filtered & Searched Articles
  const filteredArticles = useMemo(() => {
    let filtered = [...articles]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article => 
        article.submission.code.toLowerCase().includes(query) ||
        article.submission.title.toLowerCase().includes(query) ||
        article.submission.author.fullName.toLowerCase().includes(query) ||
        article.submission.author.email.toLowerCase().includes(query) ||
        article.doiLocal?.toLowerCase().includes(query)
      )
    }

    // Issue filter
    if (filterIssue !== 'all') {
      if (filterIssue === 'unassigned') {
        filtered = filtered.filter(article => !article.issue)
      } else {
        filtered = filtered.filter(article => article.issue?.id === filterIssue)
      }
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(article => article.submission.category?.name === filterCategory)
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'has-doi') {
        filtered = filtered.filter(article => !!article.doiLocal)
      } else if (filterStatus === 'no-doi') {
        filtered = filtered.filter(article => !article.doiLocal)
      } else if (filterStatus === 'published') {
        filtered = filtered.filter(article => !!article.publishedAt)
      }
    }

    return filtered
  }, [articles, searchQuery, filterIssue, filterCategory, filterStatus])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setFilterIssue('all')
    setFilterCategory('all')
    setFilterStatus('all')
  }

  const hasActiveFilters = searchQuery || filterIssue !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📄 Metadata & Xuất bản</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý DOI, số tạp chí, trang, và thông tin xuất bản
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách Bài viết</CardTitle>
              <CardDescription>
                {hasActiveFilters ? (
                  <>Hiển thị {filteredArticles.length} / {articles.length} bài viết</>
                ) : (
                  <>Tổng cộng: {articles.length} bài viết</>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter Section */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã bài, tiêu đề, tác giả, email, DOI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters (Collapsible) */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label className="text-xs mb-2">Số tạp chí</Label>
                  <Select value={filterIssue} onValueChange={setFilterIssue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="unassigned">Chưa phân công</SelectItem>
                      {issues.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          Tập {issue.volume.volumeNo}, Số {issue.number} ({issue.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2">Lĩnh vực</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2">Trạng thái</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="has-doi">Có DOI</SelectItem>
                      <SelectItem value="no-doi">Chưa có DOI</SelectItem>
                      <SelectItem value="published">Đã xuất bản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Bộ lọc đang áp dụng:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Tìm kiếm: "{searchQuery}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {filterIssue !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Số: {filterIssue === 'unassigned' ? 'Chưa phân công' : issues.find(i => i.id === filterIssue)?.number}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterIssue('all')} />
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Lĩnh vực: {filterCategory}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCategory('all')} />
                  </Badge>
                )}
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filterStatus === 'has-doi' && 'Có DOI'}
                    {filterStatus === 'no-doi' && 'Chưa có DOI'}
                    {filterStatus === 'published' && 'Đã xuất bản'}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterStatus('all')} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Xóa tất cả
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center py-8">Đang tải...</p>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào'}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã bài</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Số tạp chí</TableHead>
                  <TableHead>Trang</TableHead>
                  <TableHead>DOI</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      {article.submission.code}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {article.submission.title}
                    </TableCell>
                    <TableCell>{article.submission.author.fullName}</TableCell>
                    <TableCell>
                      {article.issue ? (
                        <Badge>
                          Tập {article.issue.volume.volumeNo}, Số {article.issue.number}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Chưa phân công</Badge>
                      )}
                    </TableCell>
                    <TableCell>{article.pages || '-'}</TableCell>
                    <TableCell>
                      {article.doiLocal ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{article.doiLocal}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Chưa có</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!article.doiLocal && article.issue && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerateDOI(article.id)}
                          >
                            <Hash className="h-4 w-4 mr-1" />
                            Tạo DOI
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(`/articles/${article.submission.id}`, '_blank')
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Metadata</DialogTitle>
            <DialogDescription>
              Bài viết: <strong>{selectedArticle?.submission.code}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
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
                placeholder="Ví dụ: 1-10, 45-52"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doiLocal">DOI</Label>
              <Input
                id="doiLocal"
                value={formData.doiLocal}
                onChange={(e) => setFormData({ ...formData, doiLocal: e.target.value })}
                placeholder="Ví dụ: 10.xxxxx/xxxx"
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
    </div>
  )
}
