'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ArticleData {
  id: string
  title: string
  authorName: string
  authorOrg: string | null
  category: string
  categoryId: string
  year: number
  issueNumber: number | null
  issueVolume: string | null
  pdfUrl: string | null
  doi: string | null
}

interface Category {
  id: string
  name: string
}

interface ArticlesTableSectionProps {
  articles: ArticleData[]
  categories: Category[]
}

export default function ArticlesTableSection({ articles, categories }: ArticlesTableSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get unique years from articles
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(articles.map(a => a.year))).sort((a, b) => b - a)
    return years
  }, [articles])

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search filter (title or author)
      const matchesSearch = searchQuery === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.authorName.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === 'all' || article.categoryId === selectedCategory

      // Year filter
      const matchesYear = selectedYear === 'all' || article.year.toString() === selectedYear

      return matchesSearch && matchesCategory && matchesYear
    })
  }, [articles, searchQuery, selectedCategory, selectedYear])

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredArticles.slice(start, end)
  }, [filteredArticles, currentPage])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedYear])

  return (
    <section className="mt-16">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Tra cứu bài báo
        </h2>
        <p className="text-gray-600">Tìm kiếm và tải xuống toàn bộ bài báo đã xuất bản</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                Tìm kiếm
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Tìm theo tên bài hoặc tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Lĩnh vực
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Tất cả lĩnh vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium text-gray-700">
                Năm xuất bản
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Tất cả năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Năm {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedCategory !== 'all' || selectedYear !== 'all') && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Đang lọc:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Tìm kiếm: "{searchQuery}"
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                )}
                {selectedYear !== 'all' && (
                  <Badge variant="secondary">
                    Năm {selectedYear}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedYear('all')
                  }}
                  className="ml-auto text-xs"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Tìm thấy <span className="font-semibold text-gray-900">{filteredArticles.length}</span> bài báo
        {filteredArticles.length !== articles.length && (
          <> từ tổng số <span className="font-semibold text-gray-900">{articles.length}</span> bài báo</>
        )}
      </div>

      {/* Articles Table */}
      <Card className="overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 font-semibold text-gray-700">STT</TableHead>
                <TableHead className="min-w-[300px] font-semibold text-gray-700">Tên bài báo</TableHead>
                <TableHead className="min-w-[150px] font-semibold text-gray-700">Tác giả</TableHead>
                <TableHead className="font-semibold text-gray-700">Lĩnh vực</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Năm</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Số</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Tải</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArticles.length > 0 ? (
                paginatedArticles.map((article, index) => (
                  <TableRow key={article.id} className="hover:bg-blue-50/50 transition-colors">
                    <TableCell className="font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/articles/${article.id}`}
                        className="text-blue-700 hover:text-blue-900 hover:underline font-medium line-clamp-2"
                      >
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{article.authorName}</div>
                        {article.authorOrg && (
                          <div className="text-xs text-gray-500 line-clamp-1">{article.authorOrg}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{article.year}</TableCell>
                    <TableCell className="text-center">
                      {article.issueNumber ? (
                        <span className="text-sm text-gray-700">
                          {article.issueVolume && `T${article.issueVolume}, `}S{article.issueNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {article.pdfUrl ? (
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <a href={article.pdfUrl} target="_blank" rel="noopener noreferrer" title="Tải PDF">
                            <Download className="h-4 w-4 text-emerald-600" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Không tìm thấy bài báo phù hợp</p>
                    <p className="text-sm text-gray-400 mt-1">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
