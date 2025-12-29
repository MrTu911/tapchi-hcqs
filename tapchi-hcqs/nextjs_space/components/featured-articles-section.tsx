'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowRight, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  excerpt?: string
  coverImage?: string
  category?: { id: string; name: string; slug: string } | null
  author?: { id: string; fullName: string; org: string | null } | null
  publishedAt?: string
}

interface FeaturedArticlesSectionProps {
  mainArticle: Article | null
  sideArticles: Article[]
}

export default function FeaturedArticlesSection({
  mainArticle,
  sideArticles
}: FeaturedArticlesSectionProps) {
  if (!mainArticle) {
    return null
  }

  return (
    <section className="mb-10">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Tin nổi bật
          </h2>
        </div>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-emerald-200 via-emerald-400 to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Featured Article - 2 columns */}
        <div className="lg:col-span-2">
          <Link href={`/articles/${mainArticle.id}`}>
            <Card className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group border-0">
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={mainArticle.coverImage || '/images/default-article.jpg'}
                  alt={mainArticle.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Badge */}
              {mainArticle.category && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                    {mainArticle.category.name}
                  </Badge>
                </div>
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg group-hover:text-yellow-300 transition-colors">
                  {mainArticle.title}
                </h3>

                {mainArticle.excerpt && (
                  <p className="text-gray-200 line-clamp-2 text-sm sm:text-base">
                    {mainArticle.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  {mainArticle.author && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>{mainArticle.author.fullName}</span>
                    </div>
                  )}
                  {mainArticle.publishedAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(mainArticle.publishedAt), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 text-emerald-300 font-semibold group-hover:text-yellow-300 transition-colors">
                    Đọc thêm
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Side Articles - 1 column */}
        <div className="flex flex-col gap-4">
          {sideArticles.slice(0, 3).map((article, index) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <Card className="flex gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300 group border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={article.coverImage || '/images/default-article.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Number Badge */}
                  <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {article.title}
                  </p>
                  {article.publishedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(article.publishedAt), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
