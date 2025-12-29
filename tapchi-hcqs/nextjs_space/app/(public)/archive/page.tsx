
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, FileText, BookOpenCheck, TrendingUp, Users, Eye, Download, Database, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ArticlesTableSection from '@/components/articles-table-section'

export const metadata: Metadata = {
  title: 'Kho Lưu trữ Bài báo Khoa học | Tạp chí KHOA HỌC HẬU CẦN QUÂN SỰ',
  description: 'Cơ sở dữ liệu học thuật công khai - Tra cứu và tải xuống toàn bộ bài báo khoa học đã xuất bản trên Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự.',
  keywords: ['lưu trữ bài báo', 'cơ sở dữ liệu học thuật', 'nghiên cứu khoa học', 'hậu cần quân sự'],
}

// Get comprehensive archive statistics
async function getArchiveStatistics() {
  try {
    const [
      totalIssues,
      totalArticles,
      totalViews,
      totalDownloads,
      totalAuthors,
      recentArticles,
      topCategories
    ] = await Promise.all([
      // Total published issues
      prisma.issue.count({
        where: { status: 'PUBLISHED' }
      }),
      
      // Total published articles
      prisma.article.count({
        where: {
          submission: {
            status: 'PUBLISHED'
          }
        }
      }),
      
      // Total article views
      prisma.article.aggregate({
        where: {
          submission: {
            status: 'PUBLISHED'
          }
        },
        _sum: {
          views: true
        }
      }),
      
      // Total downloads
      prisma.article.aggregate({
        where: {
          submission: {
            status: 'PUBLISHED'
          }
        },
        _sum: {
          downloads: true
        }
      }),
      
      // Unique authors count
      prisma.user.count({
        where: {
          submissions: {
            some: {
              status: 'PUBLISHED'
            }
          }
        }
      }),
      
      // Recent 5 articles
      prisma.article.findMany({
        where: {
          submission: {
            status: 'PUBLISHED'
          }
        },
        take: 5,
        orderBy: {
          publishedAt: 'desc'
        },
        include: {
          submission: {
            select: {
              title: true,
              author: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      }),
      
      // Top categories
      prisma.category.findMany({
        take: 5,
        where: {
          submissions: {
            some: {
              status: 'PUBLISHED'
            }
          }
        },
        include: {
          _count: {
            select: {
              submissions: {
                where: {
                  status: 'PUBLISHED'
                }
              }
            }
          }
        },
        orderBy: {
          submissions: {
            _count: 'desc'
          }
        }
      })
    ])

    return {
      totalIssues,
      totalArticles,
      totalViews: totalViews._sum.views || 0,
      totalDownloads: totalDownloads._sum.downloads || 0,
      totalAuthors,
      recentArticles,
      topCategories
    }
  } catch (error) {
    console.error('Error fetching archive statistics:', error)
    return {
      totalIssues: 0,
      totalArticles: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalAuthors: 0,
      recentArticles: [],
      topCategories: []
    }
  }
}

// Get all published issues
async function getPublishedIssues() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/issues?status=PUBLISHED`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch issues')
    }
    
    const data = await response.json()
    return data.data?.issues || []
  } catch (error) {
    console.error('Error fetching issues:', error)
    return []
  }
}

// Get all published articles for the archive table
async function getAllPublishedArticles() {
  try {
    // First, get submissions with all needed data
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'PUBLISHED',
        article: {
          isNot: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            fullName: true,
            org: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        article: {
          include: {
            issue: {
              include: {
                volume: {
                  select: {
                    volumeNo: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Transform data for the table
    return submissions
      .filter(sub => sub.article)
      .map(sub => {
        const article = sub.article!
        return {
          id: article.id,
          title: sub.title,
          authorName: sub.author.fullName,
          authorOrg: sub.author.org,
          category: sub.category?.name || 'Không xác định',
          categoryId: sub.category?.id || '',
          year: article.issue?.year || new Date(article.publishedAt || sub.createdAt).getFullYear(),
          issueNumber: article.issue?.number || null,
          issueVolume: article.issue?.volume?.volumeNo?.toString() || null,
          pdfUrl: article.pdfFile || null,
          doi: article.doiLocal
        }
      })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

// Get all categories
async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    })
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export default async function ArchivePage() {
  const [issues, stats, articles, categories] = await Promise.all([
    getPublishedIssues(),
    getArchiveStatistics(),
    getAllPublishedArticles(),
    getCategories()
  ])

  // Group issues by year
  const issuesByYear = issues?.reduce((acc: any, issue: any) => {
    const year = issue.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(issue)
    return acc
  }, {}) || {}

  const years = Object.keys(issuesByYear).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <div className="min-h-screen py-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            <Database className="h-4 w-4" />
            Cơ sở dữ liệu học thuật công khai
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Kho Lưu trữ Bài báo Khoa học
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Tra cứu, tải xuống và trích dẫn toàn bộ bài báo nghiên cứu đã xuất bản
          </p>
        </div>

        {/* Comprehensive Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 opacity-80" />
                <BarChart3 className="h-5 w-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalIssues}</div>
              <div className="text-sm opacity-90">Số tạp chí</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-8 w-8 opacity-80" />
                <TrendingUp className="h-5 w-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalArticles}</div>
              <div className="text-sm opacity-90">Bài báo</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-80" />
                <TrendingUp className="h-5 w-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalAuthors}</div>
              <div className="text-sm opacity-90">Tác giả</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-8 w-8 opacity-80" />
                <TrendingUp className="h-5 w-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalViews.toLocaleString()}</div>
              <div className="text-sm opacity-90">Lượt xem</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Download className="h-8 w-8 opacity-80" />
                <TrendingUp className="h-5 w-5 opacity-60" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalDownloads.toLocaleString()}</div>
              <div className="text-sm opacity-90">Lượt tải</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles & Top Categories */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Recent Articles */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Bài báo mới nhất
              </h3>
              <div className="space-y-3">
                {stats.recentArticles?.map((article: any) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <h4 className="font-medium text-gray-900 line-clamp-1 mb-1">
                      {article.submission.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {article.submission.author.fullName} • {new Date(article.publishedAt || article.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </Link>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/articles">
                  Xem tất cả bài báo
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Lĩnh vực nổi bật
              </h3>
              <div className="space-y-3">
                {stats.topCategories?.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <Badge variant="secondary">{category._count.submissions}</Badge>
                  </Link>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/categories">
                  Xem tất cả lĩnh vực
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {years?.length > 0 ? (
          <div className="space-y-12">
            {years.map((year) => {
              const yearIssues = issuesByYear[year]
              return (
                <div key={year} className="space-y-6">
                  {/* Year Header */}
                  <div className="flex items-center">
                    <h2 className="text-3xl font-bold text-gray-900 mr-4">
                      Năm {year}
                    </h2>
                    <Badge variant="secondary">
                      {yearIssues.length} số
                    </Badge>
                  </div>

                  {/* Issues Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {yearIssues
                      .sort((a: any, b: any) => {
                        if (a.volume !== b.volume) return b.volume - a.volume
                        return b.number - a.number
                      })
                      .map((issue: any) => (
                        <Card key={issue.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            {/* Issue Info */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  Tập {issue.volume?.volumeNo || issue.year}, Số {issue.number}
                                </h3>
                                <p className="text-gray-600">
                                  {issue.publishDate 
                                    ? new Date(issue.publishDate).toLocaleDateString('vi-VN', {
                                        month: 'long',
                                        year: 'numeric'
                                      })
                                    : `Năm ${issue.year}`
                                  }
                                </p>
                              </div>
                              <Badge variant="outline" className="text-green-700 border-green-200">
                                Đã xuất bản
                              </Badge>
                            </div>

                            {/* Articles Count */}
                            <div className="flex items-center text-gray-600 mb-6">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>{issue._count?.articles || 0} bài báo</span>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                              <Button asChild className="w-full">
                                <Link href={`/issues/${issue.id}/viewer`}>
                                  <BookOpenCheck className="h-4 w-4 mr-2" />
                                  Xem PDF Flipbook
                                </Link>
                              </Button>
                              <Button asChild variant="outline" className="w-full">
                                <Link href={`/issues/${issue.id}`}>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Xem mục lục
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có số nào được xuất bản
            </h3>
            <p className="text-gray-600">
              Các số tạp chí sẽ được cập nhật và xuất bản sớm nhất có thể.
            </p>
          </div>
        )}

        {/* Quick Links */}
        {issues?.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Khám phá thêm
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/issues/latest">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Số mới nhất
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/articles">
                    <FileText className="h-4 w-4 mr-2" />
                    Tất cả bài báo
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/author">
                    Nộp bài nghiên cứu
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Articles Table Section */}
        {articles.length > 0 && (
          <ArticlesTableSection articles={articles} categories={categories} />
        )}
      </div>
    </div>
  )
}
