
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Calendar, Download, FileText, User, BookOpenCheck } from 'lucide-react'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: { volume: true }
  })

  if (!issue) {
    return {
      title: 'Không tìm thấy số tạp chí'
    }
  }

  const title = issue.title || `Số ${issue.number} (${issue.year})`

  return {
    title: `${title} | Tạp chí Khoa học Hậu cần Quân sự`,
    description: issue.description || `Xem chi tiết ${title}`,
    openGraph: {
      title,
      description: issue.description || undefined,
      images: issue.coverImage ? [issue.coverImage] : undefined
    }
  }
}

export default async function IssueDetailPage({ params }: Props) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      volume: true,
      articles: {
        include: {
          submission: {
            include: {
              category: true,
              author: {
                select: {
                  id: true,
                  fullName: true,
                  org: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      }
    }
  })

  if (!issue) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Cover & Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              {/* Cover Image */}
              <div className="relative aspect-[3/4] bg-muted overflow-hidden rounded-lg mb-4">
                {issue.coverImage ? (
                  <Image
                    src={issue.coverImage}
                    alt={issue.title || `Số ${issue.number}/${issue.year}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center">
                    <BookOpen className="h-20 w-20 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>

              {/* Issue Info */}
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Tập {issue.volume?.volumeNo || issue.year}
                  </Badge>
                  <h2 className="text-xl font-bold">
                    {issue.title || `Số ${issue.number} (${issue.year})`}
                  </h2>
                </div>

                {issue.description && (
                  <p className="text-sm text-muted-foreground">
                    {issue.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {issue.publishDate
                        ? new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Chưa xác định'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{issue.articles.length} bài viết</span>
                  </div>
                  {issue.doi && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">DOI:</span>
                      <a
                        href={`https://doi.org/${issue.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {issue.doi}
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/issues/${issue.id}/viewer`}>
                      <BookOpenCheck className="mr-2 h-4 w-4" />
                      Xem PDF Flipbook
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/issues/${issue.id}/download`}>
                      <Download className="mr-2 h-4 w-4" />
                      Tải toàn bộ số
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/issues">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Xem tất cả số
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Articles List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách bài viết ({issue.articles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.articles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                  <p className="text-lg font-medium mb-2">Chưa có bài viết nào</p>
                  <p className="text-sm text-muted-foreground">
                    Số này đang trong quá trình biên tập
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {issue.articles.map((article, index) => (
                    <div
                      key={article.id}
                      className="pb-6 border-b last:border-b-0 last:pb-0"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            {article.submission.category && (
                              <Badge variant="outline" className="mb-2 text-xs">
                                {article.submission.category.name}
                              </Badge>
                            )}
                            <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                              <Link href={`/articles/${article.id}`}>
                                {article.submission.title}
                              </Link>
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{article.submission.author.fullName}</span>
                            {article.submission.author.org && (
                              <>
                                <span>•</span>
                                <span>{article.submission.author.org}</span>
                              </>
                            )}
                          </div>

                          {article.submission.abstractVn && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {article.submission.abstractVn}
                            </p>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/articles/${article.id}`}>
                                Xem chi tiết
                              </Link>
                            </Button>
                            {article.pdfFile && (
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={article.pdfFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
