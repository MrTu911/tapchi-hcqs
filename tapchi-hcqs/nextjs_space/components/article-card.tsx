
"use client"

import Link from 'next/link'
import { Calendar, User, Eye, Download, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ArticleCardProps {
  article: {
    id: string
    pages?: string
    views: number
    downloads: number
    publishedAt?: string
    submission: {
      title: string
      abstractVn?: string
      abstractEn?: string
      keywords: string[]
      category?: {
        name: string
        code: string
      }
      author: {
        fullName: string
        org?: string
      }
    }
    issue?: {
      volume: number
      number: number
      year: number
    }
  }
  variant?: 'default' | 'compact'
  language?: string
}

export function ArticleCard({ 
  article, 
  variant = 'default',
  language = 'vi'
}: ArticleCardProps) {
  const {
    id,
    pages,
    views,
    downloads,
    publishedAt,
    submission,
    issue
  } = article

  const abstract = language === 'vi' ? submission.abstractVn : submission.abstractEn
  const displayAbstract = abstract || submission.abstractVn || submission.abstractEn

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white overflow-hidden h-full flex flex-col shadow-lg">
      <CardContent className="p-6 flex-1">
        {/* Category Badge */}
        {submission.category && (
          <Badge className="mb-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            {submission.category.name}
          </Badge>
        )}

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={`/articles/${id}`} className="hover:underline">
            {submission.title}
          </Link>
        </h3>

        {/* Author & Organization */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <User className="h-4 w-4 mr-1" />
          <span className="font-medium">{submission.author.fullName}</span>
          {submission.author.org && (
            <>
              <span className="mx-2">•</span>
              <span>{submission.author.org}</span>
            </>
          )}
        </div>

        {/* Abstract */}
        {variant === 'default' && displayAbstract && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {displayAbstract}
          </p>
        )}

        {/* Keywords */}
        {variant === 'default' && submission.keywords?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {submission.keywords.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {submission.keywords.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{submission.keywords.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            {publishedAt && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date(publishedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {issue && (
              <span>
                Tập {issue.volume}, Số {issue.number} ({issue.year})
              </span>
            )}
            {pages && (
              <span>Trang {pages}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            <span>{views?.toLocaleString() || 0} lượt xem</span>
          </div>
          <div className="flex items-center">
            <Download className="h-3 w-3 mr-1" />
            <span>{downloads?.toLocaleString() || 0} tải về</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
        <Button 
          asChild 
          variant="ghost" 
          size="sm"
          className="w-full justify-between text-blue-600 hover:text-blue-800 font-semibold"
        >
          <Link href={`/articles/${id}`}>
            <span>Đọc bài báo</span>
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
