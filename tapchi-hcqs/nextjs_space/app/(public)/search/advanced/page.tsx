'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface SearchResult {
  id: string
  title: string
  abstract: string
  author: {
    fullName: string
    org?: string
  }
  category?: {
    name: string
  }
  keywords: string[]
  createdAt: string
  issue?: {
    volume: { number: number }
    number: number
    year: number
  }
}

export default function AdvancedSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [filters, setFilters] = useState({
    keyword: searchParams?.get('keyword') || '',
    title: searchParams?.get('title') || '',
    author: searchParams?.get('author') || '',
    affiliation: searchParams?.get('affiliation') || '',
    categoryId: searchParams?.get('categoryId') || 'all',
    yearFrom: searchParams?.get('yearFrom') || '',
    yearTo: searchParams?.get('yearTo') || '',
    keywords: searchParams?.get('keywords') || ''
  })

  useEffect(() => {
    fetchCategories()
    // Auto search if params exist
    if (searchParams?.get('keyword') || searchParams?.get('title')) {
      handleSearch()
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/search/advanced?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data || [])
      } else {
        toast.error(data.error || 'Lỗi tìm kiếm')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({
      keyword: '',
      title: '',
      author: '',
      affiliation: '',
      categoryId: 'all',
      yearFrom: '',
      yearTo: '',
      keywords: ''
    })
    setResults([])
    setHasSearched(false)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:underline">Trang chủ</Link>
          <span>/</span>
          <Link href="/search" className="hover:underline">Tra cứu</Link>
          <span>/</span>
          <span>Tìm kiếm nâng cao</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">Tìm kiếm Nâng cao</h1>
        <p className="text-muted-foreground">
          Sử dụng các bộ lọc chi tiết để tìm kiếm bài viết chính xác hơn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Bộ lọc tìm kiếm
              </CardTitle>
              <CardDescription>
                Điền thông tin để lọc kết quả
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Từ khóa chung</Label>
                <Input
                  id="keyword"
                  placeholder="Tìm trong tất cả các trường..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề..."
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Tác giả</Label>
                <Input
                  id="author"
                  placeholder="Tên tác giả..."
                  value={filters.author}
                  onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Đơn vị công tác</Label>
                <Input
                  id="affiliation"
                  placeholder="Tên đơn vị..."
                  value={filters.affiliation}
                  onChange={(e) => setFilters({ ...filters, affiliation: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Chuyên mục</Label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả chuyên mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="yearFrom">Từ năm</Label>
                  <Select
                    value={filters.yearFrom}
                    onValueChange={(value) => setFilters({ ...filters, yearFrom: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Năm" />
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
                  <Label htmlFor="yearTo">Đến năm</Label>
                  <Select
                    value={filters.yearTo}
                    onValueChange={(value) => setFilters({ ...filters, yearTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Năm" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Từ khóa (keywords)</Label>
                <Input
                  id="keywords"
                  placeholder="Ví dụ: AI, logistics..."
                  value={filters.keywords}
                  onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <p className="text-xs text-muted-foreground">
                  Tách nhiều từ khóa bằng dấu phẩy
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex-1"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả tìm kiếm</CardTitle>
              <CardDescription>
                {hasSearched
                  ? `Tìm thấy ${results.length} bài viết`
                  : 'Nhập bộ lọc và nhấn "Tìm kiếm"'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Đang tìm kiếm...</p>
                </div>
              ) : !hasSearched ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Sử dụng bộ lọc bên trái để bắt đầu tìm kiếm
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Không tìm thấy kết quả phù hợp
                  </p>
                  <Button onClick={handleReset} variant="outline" className="mt-4">
                    Đặt lại bộ lọc
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {results.map((article) => (
                    <div
                      key={article.id}
                      className="pb-6 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {article.category && (
                              <Badge variant="secondary" className="mb-2">
                                {article.category.name}
                              </Badge>
                            )}
                            <h3 className="text-xl font-semibold hover:text-primary mb-2">
                              <Link href={`/articles/${article.id}`}>
                                {article.title}
                              </Link>
                            </h3>
                          </div>
                          {article.issue && (
                            <Badge variant="outline">
                              Tập {article.issue.volume.number}, Số {article.issue.number} ({article.issue.year})
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{article.author.fullName}</span>
                          {article.author.org && (
                            <span className="ml-1">- {article.author.org}</span>
                          )}
                        </p>

                        {article.abstract && (
                          <p className="text-sm line-clamp-3">{article.abstract}</p>
                        )}

                        {article.keywords && article.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {article.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-2">
                          <Button size="sm" variant="default" asChild>
                            <Link href={`/articles/${article.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Ngày đăng:{' '}
                            {new Date(article.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
