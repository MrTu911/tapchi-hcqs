
import { getServerSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit, BookOpen, Calendar } from 'lucide-react'

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    include: {
      volume: true,
      articles: {
        include: {
          submission: {
            include: {
              category: true,
              author: true
            }
          }
        },
        orderBy: {
          pages: 'asc'
        }
      }
    }
  })

  if (!issue) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/managing/issues">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Tập {issue.volume?.volumeNo}, Số {issue.number} ({issue.year})
          </h1>
          <p className="text-muted-foreground mt-1">
            Chi tiết số tạp chí
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/managing/issues/${issue.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin chung</CardTitle>
                <Badge variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {issue.title && (
                <div>
                  <p className="text-sm text-muted-foreground">Tiêu đề</p>
                  <p className="font-medium">{issue.title}</p>
                </div>
              )}
              {issue.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p>{issue.description}</p>
                </div>
              )}
              {issue.doi && (
                <div>
                  <p className="text-sm text-muted-foreground">DOI</p>
                  <p className="font-mono text-sm">{issue.doi}</p>
                </div>
              )}
              {issue.publishDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày xuất bản</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài viết trong số này ({issue.articles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.articles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có bài viết nào</p>
                  <p className="text-sm mt-1">Gán bài viết vào số này từ trang Quản lý bài viết</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issue.articles.map((article, index) => (
                    <div key={article.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="text-muted-foreground font-mono text-sm mt-1">
                          {article.pages || `#${index + 1}`}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">
                            <Link 
                              href={`/articles/${article.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {article.submission.title}
                            </Link>
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{article.submission.author.fullName}</span>
                            {article.submission.category && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {article.submission.category.name}
                                </Badge>
                              </>
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ảnh bìa</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.coverImage ? (
                <img
                  src={issue.coverImage}
                  alt={`Bìa số ${issue.number}`}
                  className="w-full rounded-lg border"
                />
              ) : (
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Chưa có ảnh bìa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
