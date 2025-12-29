'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, FileText, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Issue {
  id: string
  title?: string
  description?: string
  coverImage?: string
  publishDate?: string
  volume: {
    volumeNo: number
  }
  number: number
  year: number
  _count?: {
    articles: number
  }
}

interface EnhancedIssuesSidebarProps {
  issues: Issue[]
}

export default function EnhancedIssuesSidebar({ issues }: EnhancedIssuesSidebarProps) {
  if (!issues || issues.length === 0) {
    return null
  }

  const mainIssue = issues[0]
  const sideIssues = issues.slice(1, 4)

  return (
    <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5" />
          Các số mới
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Main Issue */}
        <div className="p-4 border-b-2 border-emerald-100 dark:border-emerald-900">
          <Link href={`/issues/${mainIssue.id}`} className="group block">
            <div className="relative">
              {/* Cover Image */}
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md mb-3">
                <Image
                  src={mainIssue.coverImage || '/images/default-cover.jpg'}
                  alt={`Số ${mainIssue.number}/${mainIssue.year}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* NEW Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg animate-pulse">
                    MỚI NHẤT
                  </Badge>
                </div>
              </div>

              {/* Issue Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold">
                    Tập {mainIssue.volume.volumeNo}, Số {mainIssue.number}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {mainIssue.year}
                  </span>
                </div>

                {mainIssue.title && (
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {mainIssue.title}
                  </h3>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {mainIssue.publishDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(mainIssue.publishDate), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  )}
                  {mainIssue._count && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{mainIssue._count.articles} bài</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white mt-2"
                >
                  Xem toàn bộ số
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Side Issues List */}
        {sideIssues.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sideIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="flex items-center gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors group"
              >
                {/* Mini Cover */}
                <div className="relative w-12 h-16 rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                  <Image
                    src={issue.coverImage || '/images/default-cover.jpg'}
                    alt={`Số ${issue.number}/${issue.year}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Tập {issue.volume.volumeNo}, Số {issue.number}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{issue.year}</span>
                    {issue._count && (
                      <>
                        <span>•</span>
                        <span>{issue._count.articles} bài</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="p-3 border-t-2 border-emerald-100 dark:border-emerald-900">
          <Link href="/issues" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              Xem tất cả các số
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
