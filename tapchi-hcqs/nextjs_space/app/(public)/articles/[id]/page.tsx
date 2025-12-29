
import { ArticleCard } from '@/components/article-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, Eye, Download, BookOpen, ArrowLeft, FileText, Hash, Quote } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid React Hooks errors
const ShareButton = dynamic(() => import('@/components/share-button').then(mod => ({ default: mod.ShareButton })), {
  ssr: false,
  loading: () => <Button variant="outline" disabled>Chia sẻ</Button>
})

const ScrollProgress = dynamic(() => import('@/components/scroll-progress').then(mod => ({ default: mod.ScrollProgress })), {
  ssr: false
})

const PDFViewerSimple = dynamic(() => import('@/components/pdf-viewer-simple').then(mod => ({ default: mod.PDFViewerSimple })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

const TableOfContents = dynamic(() => import('@/components/table-of-contents').then(mod => ({ default: mod.TableOfContents })), {
  ssr: false
})

const ArticleComments = dynamic(() => import('@/components/article-comments').then(mod => ({ default: mod.ArticleComments })), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />
})

const CitationBox = dynamic(() => import('@/components/citation-box').then(mod => ({ default: mod.CitationBox })), {
  ssr: false
})

// Get article by ID
async function getArticle(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/articles/${id}`, {
      next: { revalidate: 300 }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch article')
    }
    
    const data = await response.json()
    return {
      article: data.article,
      relatedArticles: data.relatedArticles || []
    }
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const articleData = await getArticle(id)
  
  if (!articleData) {
    return {
      title: 'Không tìm thấy bài báo',
      description: 'Bài báo không tồn tại hoặc đã bị xóa.'
    }
  }

  const { article } = articleData
  
  return {
    title: article.submission.title,
    description: article.submission.abstractVn || article.submission.abstractEn || 'Bài báo khoa học',
    openGraph: {
      title: article.submission.title,
      description: article.submission.abstractVn || article.submission.abstractEn,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.submission.author.fullName],
    },
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params
  const articleData = await getArticle(id)

  if (!articleData) {
    notFound()
  }

  const { article, relatedArticles } = articleData

  // Prepare citation data
  const citationData = {
    title: article.submission.title,
    authors: article.submission.author.fullName,
    year: article.publishedAt ? new Date(article.publishedAt).getFullYear().toString() : new Date().getFullYear().toString(),
    volume: article.issue?.volume?.volumeNo?.toString() || article.issue?.year?.toString(),
    issue: article.issue?.number?.toString(),
    pages: article.pages || undefined,
    doi: article.doiLocal || undefined,
    journal: 'Tạp chí Khoa học Hậu cần Quân sự',
  }

  return (
    <>
      {/* Scroll Progress Bar */}
      <ScrollProgress />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-[1280px] mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-8">
            <Button asChild variant="ghost" className="hover:bg-emerald-50">
              <Link href="/articles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Trở lại danh sách
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Article Header */}
              <article className="bg-white rounded-2xl shadow-lg p-8 lg:p-10 border border-gray-100">
                {/* Category Badge */}
                {article.submission.category && (
                  <Badge className="mb-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    {article.submission.category.name}
                  </Badge>
                )}

                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight font-serif">
                  {article.submission.title}
                </h1>

                {/* Author Info */}
                <div className="flex flex-wrap items-center gap-6 pb-6 mb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                      {article.submission.author.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {article.submission.author.fullName}
                      </div>
                      {article.submission.author.org && (
                        <div className="text-sm text-gray-600">
                          {article.submission.author.org}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                  {article.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                  {article.issue && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span>
                        Tập {article.issue.volume?.volumeNo || article.issue.year}, Số {article.issue.number} ({article.issue.year})
                      </span>
                    </div>
                  )}
                  {article.pages && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      <span>Trang {article.pages}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm pb-6 mb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{article.views?.toLocaleString() || 0} lượt xem</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                    <Download className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">{article.downloads?.toLocaleString() || 0} tải về</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {article.pdfFile && (
                    <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Link href={article.pdfFile} target="_blank">
                        <Download className="h-4 w-4 mr-2" />
                        Tải toàn văn PDF
                      </Link>
                    </Button>
                  )}
                  
                  <ShareButton 
                    title={article.submission.title}
                    text={article.submission.abstractVn || ''}
                  />
                </div>
              </article>

              {/* Abstract */}
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-md">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Quote className="h-6 w-6 text-emerald-700" />
                    <h2 className="text-2xl font-bold text-emerald-900">Tóm tắt</h2>
                  </div>
                  
                  {article.submission.abstractVn && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-3">Tiếng Việt</h3>
                      <p className="text-gray-800 leading-relaxed text-justify">
                        {article.submission.abstractVn}
                      </p>
                    </div>
                  )}

                  {article.submission.abstractEn && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-emerald-900 mb-3">Abstract</h3>
                      <p className="text-gray-800 leading-relaxed text-justify italic">
                        {article.submission.abstractEn}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {article.submission.keywords?.length > 0 && (
                    <div className="pt-6 border-t border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-5 w-5 text-emerald-700" />
                        <h3 className="text-lg font-semibold text-emerald-900">Từ khóa</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {article.submission.keywords.map((keyword: string) => (
                          <Badge 
                            key={keyword} 
                            className="bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Article Content */}
              {article.htmlBody && (
                <Card className="shadow-md">
                  <CardContent className="p-8 lg:p-10">
                    <div 
                      className="article-content prose prose-lg prose-emerald max-w-none 
                        prose-headings:font-serif prose-headings:text-gray-900 prose-headings:font-bold
                        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-emerald-200 prose-h2:pb-2
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify prose-p:mb-4
                        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6
                        prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-ul:my-4 prose-ol:my-4 prose-li:my-2
                        prose-code:text-emerald-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg
                        prose-table:border-collapse prose-table:my-6 
                        prose-th:bg-emerald-50 prose-th:border prose-th:border-emerald-200 prose-th:p-3 prose-th:text-left prose-th:font-semibold
                        prose-td:border prose-td:border-gray-200 prose-td:p-3"
                      dangerouslySetInnerHTML={{ __html: article.htmlBody }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* PDF Viewer for Mobile/Tablet */}
              {article.pdfFile && (
                <div className="lg:hidden">
                  <PDFViewerSimple 
                    fileUrl={article.pdfFile}
                    title={article.submission.title}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Table of Contents */}
              {article.htmlBody && <TableOfContents />}

              {/* PDF Viewer for Desktop */}
              {article.pdfFile && (
                <div className="hidden lg:block">
                  <PDFViewerSimple 
                    fileUrl={article.pdfFile}
                    title="Xem toàn văn"
                  />
                </div>
              )}

              {/* Citation Box */}
              <CitationBox article={citationData} />

              {/* Article Info */}
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Thông tin bài báo
                  </h3>
                  <div className="space-y-3 text-sm">
                    {article.doiLocal && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-600 block mb-1">DOI:</span>
                        <span className="font-mono text-blue-700 text-xs break-all">
                          {article.doiLocal}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <span className="text-gray-600 block mb-1">Tác giả:</span>
                      <span className="font-medium text-gray-900">
                        {article.submission.author.fullName}
                      </span>
                    </div>

                    {article.submission.author.email && (
                      <div>
                        <span className="text-gray-600 block mb-1">Email:</span>
                        <a href={`mailto:${article.submission.author.email}`} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                          {article.submission.author.email}
                        </a>
                      </div>
                    )}

                    {article.submission.category && (
                      <div>
                        <span className="text-gray-600 block mb-1">Chuyên mục:</span>
                        <span className="text-gray-900">
                          {article.submission.category.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Related Articles */}
          {relatedArticles?.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 font-serif">Bài báo liên quan</h2>
                <Button asChild variant="outline" className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
                  <Link href={`/categories/${article.submission.category?.slug}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Xem thêm
                  </Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles?.slice(0, 3)?.map((relatedArticle: any) => (
                  <ArticleCard 
                    key={relatedArticle.id} 
                    article={relatedArticle}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <ArticleComments articleId={article.id} />
          </div>
        </div>
      </div>
    </>
  )
}
