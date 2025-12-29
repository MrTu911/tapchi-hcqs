'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Search, Loader2, FileText, X } from 'lucide-react'

interface Article {
  id: string
  title: string
  submission: {
    id: string
    code: string
    author: {
      fullName: string
      org?: string
    }
    category?: {
      id: string
      name: string
      code: string
    }
    status: string
    createdAt: string
  }
}

interface Category {
  id: string
  name: string
  code: string
}

interface AddArticlesToIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issueId: string
  onSuccess: () => void
}

export function AddArticlesToIssueDialog({
  open,
  onOpenChange,
  issueId,
  onSuccess
}: AddArticlesToIssueDialogProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      fetchAvailableArticles()
      fetchCategories()
    }
  }, [open])

  const fetchAvailableArticles = async () => {
    try {
      setLoading(true)
      // Fetch articles with status ACCEPTED or IN_PRODUCTION that don't have issueId
      const response = await fetch('/api/articles?status=ACCEPTED,IN_PRODUCTION&withoutIssue=true')
      const data = await response.json()
      
      if (response.ok && data.success) {
        setArticles(data.data?.articles || [])
      } else {
        console.error('Fetch articles error:', data)
      }
    } catch (error) {
      console.error('Fetch articles error:', error)
      toast.error('Lỗi tải danh sách bài viết')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (response.ok) {
        setCategories(data.categories || data.data || [])
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.submission.author.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.submission.code.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      article.submission.category?.id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleToggleArticle = (articleId: string) => {
    const newSelection = new Set(selectedArticles)
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId)
    } else {
      newSelection.add(articleId)
    }
    setSelectedArticles(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(filteredArticles.map(a => a.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedArticles.size === 0) {
      toast.error('Vui lòng chọn ít nhất một bài viết')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/issues/add-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId,
          articleIds: Array.from(selectedArticles)
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`Đã thêm ${selectedArticles.size} bài viết vào số tạp chí`)
        setSelectedArticles(new Set())
        onSuccess()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi thêm bài viết')
      }
    } catch (error) {
      console.error('Add articles error:', error)
      toast.error('Lỗi kết nối server')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedArticles(new Set())
    setSearchQuery('')
    setSelectedCategory('all')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm bài báo vào số tạp chí</DialogTitle>
          <DialogDescription>
            Chọn các bài báo đã được chấp nhận để thêm vào số này. Bạn có thể tìm kiếm theo tiêu đề hoặc tác giả.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm theo tiêu đề, tác giả, mã bài..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Lọc theo danh mục</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Hiển thị <strong>{filteredArticles.length}</strong> bài viết
              {selectedArticles.size > 0 && (
                <span className="ml-2">
                  • Đã chọn <strong className="text-primary">{selectedArticles.size}</strong> bài
                </span>
              )}
            </div>
            {filteredArticles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedArticles.size === filteredArticles.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            )}
          </div>
        </div>

        {/* Articles Table */}
        <div className="border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Đang tải...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {articles.length === 0 
                  ? 'Không có bài viết nào sẵn sàng để thêm vào số này'
                  : 'Không tìm thấy bài viết phù hợp với bộ lọc'}
              </p>
              {searchQuery || selectedCategory !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="mt-4"
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedArticles.size === filteredArticles.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow 
                      key={article.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleToggleArticle(article.id)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedArticles.has(article.id)}
                          onCheckedChange={() => handleToggleArticle(article.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium line-clamp-2">{article.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Mã: {article.submission.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{article.submission.author.fullName}</div>
                          {article.submission.author.org && (
                            <div className="text-xs text-muted-foreground">
                              {article.submission.author.org}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {article.submission.category && (
                          <Badge variant="outline">
                            {article.submission.category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {article.submission.status === 'ACCEPTED' ? 'Đã chấp nhận' : 'Đang sản xuất'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || selectedArticles.size === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? 'Đang thêm...' : `Thêm ${selectedArticles.size} bài viết`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
