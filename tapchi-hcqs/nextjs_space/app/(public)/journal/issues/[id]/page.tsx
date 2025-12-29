
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { Calendar, User, FileText, Hash, Eye } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await params
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      volume: true,
      articles: {
        include: {
          submission: {
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  org: true
                }
              },
              category: true
            }
          }
        },
        orderBy: {
          pages: 'asc'
        }
      }
    }
  })

  if (!issue || issue.status !== 'PUBLISHED') {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Issue Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6">
              {issue.coverImage && (
                <div className="relative w-full md:w-48 h-64 bg-muted rounded-md overflow-hidden">
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa số ${issue.number}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Badge variant="secondary">
                    Tập {issue.volume.volumeNo}, Số {issue.number}
                  </Badge>
                  <span>•</span>
                  <span>Năm {issue.year}</span>
                </div>
                <CardTitle className="text-3xl mb-3">
                  {issue.title || `Số ${issue.number}`}
                </CardTitle>
                {issue.description && (
                  <CardDescription className="text-base">
                    {issue.description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {issue.publishDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Xuất bản:{' '}
                        {new Date(issue.publishDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  {issue.doi && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span>DOI: {issue.doi}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{issue.articles.length} bài viết</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Articles List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Các bài viết trong số này</h2>
          {issue.articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Số này chưa có bài viết nào
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {issue.articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-xl leading-tight">
                          <Link
                            href={`/articles/${article.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {article.submission.title}
                          </Link>
                        </CardTitle>
                        {article.pages && (
                          <Badge variant="outline" className="shrink-0">
                            Trang {article.pages}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{article.submission.author.fullName}</span>
                        </div>
                        {article.submission.author.org && (
                          <>
                            <span>•</span>
                            <span>{article.submission.author.org}</span>
                          </>
                        )}
                        {article.submission.category && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary">
                              {article.submission.category.name}
                            </Badge>
                          </>
                        )}
                      </div>

                      {article.submission.abstractVn && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {article.submission.abstractVn}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <Link href={`/articles/${article.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>
                        {article.doiLocal && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" />
                            <span>{article.doiLocal}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link href="/journal">
            <Button variant="ghost">
              ← Quay lại Kho Tạp chí
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
