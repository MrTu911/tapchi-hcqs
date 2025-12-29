
import { ArticleCard } from '@/components/article-card'
import { SearchBar } from '@/components/search-bar'
import { ArticlesFilters } from '@/components/articles-filters'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bài báo',
  description: 'Tổng hợp tất cả các bài báo khoa học được xuất bản trên Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự.',
}

// Get articles
async function getArticles(searchParams: any) {
  try {
    const params = new URLSearchParams()
    if (searchParams?.page) params.set('page', searchParams.page)
    if (searchParams?.category) params.set('categoryId', searchParams.category)
    if (searchParams?.year) params.set('year', searchParams.year)
    if (searchParams?.search) params.set('search', searchParams.search)
    params.set('limit', '12')
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles?${params.toString()}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles')
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching articles:', error)
    return { articles: [], pagination: { page: 1, totalPages: 0, total: 0 } }
  }
}

// Get categories
async function getCategories() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/categories`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-80"></div>
        </div>
      ))}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; year?: string; search?: string }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const [articlesData, categories] = await Promise.all([
    getArticles(resolvedParams),
    getCategories()
  ])

  const { articles, pagination } = articlesData

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Bài báo khoa học
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Tổng hợp tất cả các bài báo nghiên cứu được xuất bản trên tạp chí
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              placeholder="Tìm kiếm bài báo..."
              initialQuery={resolvedParams?.search}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <ArticlesFilters categories={categories} years={years} />
          </div>

          {/* Articles Grid */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                Hiển thị {articles?.length || 0} trong tổng số {pagination?.total || 0} bài báo
                {resolvedParams?.search && (
                  <span> cho "{resolvedParams.search}"</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Trang:</span>
                <span className="text-sm font-medium">
                  {pagination?.page || 1} / {pagination?.totalPages || 1}
                </span>
              </div>
            </div>

            {articles?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article: any) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy bài báo
                </h3>
                <p className="text-gray-600">
                  {resolvedParams?.search 
                    ? `Không có kết quả nào cho "${resolvedParams.search}"`
                    : 'Chưa có bài báo nào với tiêu chí lọc này'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                {pagination.hasPrev && (
                  <Button asChild variant="outline">
                    <Link href={`/articles?page=${pagination.page - 1}`}>
                      Trang trước
                    </Link>
                  </Button>
                )}
                
                <span className="text-sm text-gray-600">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                
                {pagination.hasNext && (
                  <Button asChild variant="outline">
                    <Link href={`/articles?page=${pagination.page + 1}`}>
                      Trang sau
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
