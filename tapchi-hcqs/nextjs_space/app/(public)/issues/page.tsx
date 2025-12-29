
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Calendar, FileText, BookOpenCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Các Số Tạp chí | Tạp chí Khoa học Hậu cần Quân sự',
  description: 'Danh sách các số tạp chí đã xuất bản',
}

export const revalidate = 3600 // Revalidate mỗi giờ

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    where: {
      status: 'PUBLISHED'
    },
    include: {
      volume: true,
      _count: {
        select: { articles: true }
      }
    },
    orderBy: [
      { year: 'desc' },
      { number: 'desc' }
    ]
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Các Số Tạp chí</h1>
        <p className="text-lg text-muted-foreground">
          Danh sách các số tạp chí đã xuất bản ({issues.length} số)
        </p>
      </div>

      {/* Issues Grid */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium mb-2">Chưa có số tạp chí nào được xuất bản</p>
            <p className="text-sm text-muted-foreground">
              Vui lòng quay lại sau
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {issues.map((issue) => (
            <Card key={issue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/issues/${issue.id}`} className="block group">
                {/* Cover Image */}
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  {issue.coverImage ? (
                    <Image
                      src={issue.coverImage}
                      alt={`Số ${issue.number}/${issue.year}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-muted-foreground opacity-30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2">
                      <BookOpenCheck className="mr-2 h-4 w-4" />
                      Xem PDF
                    </div>
                  </div>
                </div>

                {/* Issue Info */}
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Tập {issue.volume?.volumeNo || issue.year}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {issue.year}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {issue.title || `Số ${issue.number} (${issue.year})`}
                    </h3>
                    {issue.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{issue._count.articles} bài</span>
                      </div>
                      {issue.publishDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
