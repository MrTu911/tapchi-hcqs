
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Calendar, User } from 'lucide-react'

interface RecentArticlesListProps {
  articles: Array<{
    id: string
    publishedAt?: string
    submission: {
      title: string
      author: {
        fullName: string
      }
    }
  }>
}

export function RecentArticlesList({ articles }: RecentArticlesListProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-teal-600 flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Bài mới nhất</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {articles.slice(0, 6).map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="block p-3 rounded-lg hover:bg-accent transition-colors group border"
            >
              <div className="flex items-start gap-2 mb-1">
                <FileText className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <h4 className="text-sm font-medium line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                  {article.submission.title}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-6">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="line-clamp-1">{article.submission.author.fullName}</span>
                </div>
                {article.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/articles"
          className="block mt-3 pt-3 border-t text-sm text-center text-primary hover:underline font-medium"
        >
          Xem tất cả bài viết →
        </Link>
      </CardContent>
    </Card>
  )
}
