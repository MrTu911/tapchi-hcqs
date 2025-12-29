
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, BookOpen, ChevronRight } from 'lucide-react'

interface LatestIssueCardProps {
  issue: {
    id: string
    number: number
    year: number
    title?: string
    description?: string
    coverImage?: string
    publishDate?: string
    volume?: {
      volumeNo: number
    }
    articles: Array<{
      id: string
      submission: {
        title: string
        category?: {
          name: string
        }
      }
    }>
  }
}

export function LatestIssueCard({ issue }: LatestIssueCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-2">Số mới nhất</Badge>
            <CardTitle className="text-2xl">
              Tập {issue.volume?.volumeNo || "N/A"}, Số {issue.number} ({issue.year})
            </CardTitle>
            {issue.title && (
              <p className="text-muted-foreground mt-1">{issue.title}</p>
            )}
          </div>
        </div>
        {issue.publishDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Cover Image */}
          <div className="md:col-span-1">
            {issue.coverImage ? (
              <Link href={`/issues/${issue.id}`} className="block group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border shadow-md group-hover:shadow-xl transition-shadow">
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa Số ${issue.number}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            ) : (
              <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center border">
                <BookOpen className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>

          {/* Articles List */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Các bài viết ({issue.articles.length})
            </h3>
            {issue.articles.length > 0 ? (
              <div className="space-y-2 mb-4">
                {issue.articles.slice(0, 5).map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground font-mono text-sm shrink-0 mt-0.5">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {article.submission.title}
                        </p>
                        {article.submission.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {article.submission.category.name}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mb-4">
                Chưa có bài viết trong số này
              </p>
            )}
            
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/issues/${issue.id}`}>
                  Xem toàn bộ số
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/archive">Kho lưu trữ</Link>
              </Button>
            </div>
          </div>
        </div>

        {issue.description && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              {issue.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
