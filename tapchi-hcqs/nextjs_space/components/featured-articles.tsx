
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Calendar, User, ChevronRight } from 'lucide-react'

interface FeaturedArticlesProps {
  articles: Array<{
    id: string
    publishedAt?: string
    views: number
    submission: {
      title: string
      abstractVn?: string
      category?: {
        name: string
        slug: string
      }
      author: {
        fullName: string
        org?: string
      }
    }
    issue?: {
      number: number
      year: number
      volume?: {
        volumeNo: number
      }
    }
  }>
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  if (articles.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Star className="h-6 w-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Bài viết nổi bật</h2>
            <p className="text-sm text-muted-foreground">
              Những nghiên cứu được đánh giá cao
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              {/* Header with featured badge */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-4 border-b">
                <div className="flex items-start justify-between">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 border-0">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Nổi bật
                  </Badge>
                  {article.issue && (
                    <Badge variant="outline" className="text-xs">
                      Số {article.issue.number}/{article.issue.year}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {/* Category */}
                {article.submission.category && (
                  <Link href={`/categories/${article.submission.category.slug}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-primary/10 transition-colors">
                      {article.submission.category.name}
                    </Badge>
                  </Link>
                )}

                {/* Title */}
                <Link href={`/articles/${article.id}`}>
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {article.submission.title}
                  </h3>
                </Link>

                {/* Abstract */}
                {article.submission.abstractVn && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.submission.abstractVn}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-col gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{article.submission.author.fullName}</span>
                    {article.submission.author.org && (
                      <>
                        <span>•</span>
                        <span>{article.submission.author.org}</span>
                      </>
                    )}
                  </div>
                  {article.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Read more button */}
                <Button 
                  asChild 
                  className="w-full group/btn"
                  variant="outline"
                >
                  <Link href={`/articles/${article.id}`}>
                    Đọc bài viết
                    <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length >= 3 && (
        <div className="mt-6 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/articles?featured=true">
              Xem thêm bài viết nổi bật
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
