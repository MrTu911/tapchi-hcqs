
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User } from 'lucide-react'

export default async function CategoryPage({
  params
}: {
  params: { slug: string }
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      submissions: {
        where: {
          status: 'PUBLISHED'
        },
        include: {
          article: {
            include: {
              issue: true
            }
          },
          author: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!category) {
    notFound()
  }

  const publishedArticles = category.submissions.filter(s => s.article)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh mục
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      {publishedArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Chưa có bài viết nào trong chuyên mục này</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {publishedArticles.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Link href={`/articles/${submission.article?.id}`}>
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary line-clamp-2">
                    {submission.title}
                  </h3>
                </Link>
                
                {submission.abstractVn && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {submission.abstractVn}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {submission.keywords.slice(0, 3).map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{submission.author.fullName}</span>
                  </div>
                  {submission.article?.issue && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Số {submission.article.issue.number}/{submission.article.issue.year}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
