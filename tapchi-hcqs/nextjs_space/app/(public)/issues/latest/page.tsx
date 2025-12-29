
import { Suspense } from 'react'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Số Mới Nhất - Tạp chí Hậu cần - Kỹ thuật Quân sự',
  description: 'Số phát hành mới nhất của Tạp chí Hậu cần - Kỹ thuật Quân sự'
}

async function getLatestIssue() {
  try {
    const issue = await prisma.issue.findFirst({
      where: {
        status: 'PUBLISHED'
      },
      orderBy: [
        { year: 'desc' },
        { number: 'desc' }
      ],
      include: {
        volume: true,
        articles: {
          where: {
            submission: {
              status: 'PUBLISHED'
            }
          },
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    fullName: true,
                    org: true
                  }
                },
                category: true
              }
            }
          },
          orderBy: {
            publishedAt: 'asc'
          }
        }
      }
    })

    return issue
  } catch (error) {
    console.error('Error fetching latest issue:', error)
    return null
  }
}

export default async function LatestIssuePage() {
  const issue = await getLatestIssue()

  if (!issue) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chưa có số tạp chí nào được xuất bản.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:underline">Trang chủ</Link>
          <span>/</span>
          <Link href="/archive" className="hover:underline">Kho lưu trữ</Link>
          <span>/</span>
          <span>Số mới nhất</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">Số Mới Nhất</h1>
        <p className="text-xl text-muted-foreground">
          Tập {issue.volume.volumeNo}, Số {issue.number} - Năm {issue.year}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cover & Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Thông tin Số</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {issue.coverImage && (
                <div className="relative aspect-[3/4] w-full bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={issue.coverImage}
                    alt={`Bìa Tập ${issue.volume.volumeNo} Số ${issue.number}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {issue.publishDate
                      ? new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Năm ' + issue.year}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{issue.articles.length} bài viết</span>
                </div>

                {issue.doi && (
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">
                      DOI: {issue.doi}
                    </Badge>
                  </div>
                )}
              </div>

              {issue.title && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">{issue.title}</h3>
                  {issue.description && (
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  )}
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2">
                <Button className="w-full" asChild>
                  <Link href={`/issues/${issue.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Xem đầy đủ
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mục lục</CardTitle>
              <CardDescription>
                {issue.articles.length} bài viết trong số này
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {issue.articles.map((article) => (
                  <div
                    key={article.id}
                    className="pb-6 border-b last:border-b-0 last:pb-0"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          {article.submission.category && (
                            <Badge variant="secondary" className="mb-2">
                              {article.submission.category.name}
                            </Badge>
                          )}
                          <h3 className="text-lg font-semibold hover:text-primary">
                            <Link href={`/articles/${article.id}`}>
                              {article.submission.title}
                            </Link>
                          </h3>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {article.submission.author.fullName}
                          {article.submission.author.org && (
                            <span className="ml-1">
                              ({article.submission.author.org})
                            </span>
                          )}
                        </p>

                        {article.submission.abstractVn && (
                          <p className="text-sm line-clamp-2">
                            {article.submission.abstractVn}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/articles/${article.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
                          {article.pdfFile && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={article.pdfFile} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-3 w-3" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
