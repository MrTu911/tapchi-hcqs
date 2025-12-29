
"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Filter, BookOpen, Grid, List } from 'lucide-react'
import Link from 'next/link'

interface ArticlesFiltersProps {
  categories: any[]
  years: number[]
}

export function ArticlesFilters({ categories, years }: ArticlesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`/articles?${params.toString()}`)
  }

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === 'all') {
      params.delete('year')
    } else {
      params.set('year', value)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`/articles?${params.toString()}`)
  }

  const currentCategory = searchParams?.get('category') || 'all'
  const currentYear = searchParams?.get('year') || 'all'

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Lọc bài báo
          </h3>

          {/* Category Filter */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium text-gray-700">
              Chuyên mục
            </label>
            <Select value={currentCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chuyên mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chuyên mục</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Năm xuất bản
            </label>
            <Select value={currentYear} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Liên kết nhanh
          </h3>
          <div className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/issues/latest">
                <BookOpen className="h-4 w-4 mr-2" />
                Số mới nhất
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/archive">
                <Grid className="h-4 w-4 mr-2" />
                Lưu trữ
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/author">
                <List className="h-4 w-4 mr-2" />
                Nộp bài
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
