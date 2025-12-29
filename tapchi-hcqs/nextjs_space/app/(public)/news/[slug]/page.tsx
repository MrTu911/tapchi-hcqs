
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Eye, Tag, Share2, Facebook, Twitter, Linkedin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NewsDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const news = await prisma.news.findUnique({
    where: { slug: params.slug },
  });

  if (!news) {
    return {
      title: 'Không tìm thấy tin tức',
    };
  }

  return {
    title: `${news.title} - Tạp chí điện tử Khoa học Hậu cần quân sự`,
    description: news.summary || news.title,
    openGraph: {
      title: news.title,
      description: news.summary || news.title,
      images: news.coverImage ? [news.coverImage] : [],
      type: 'article',
      publishedTime: news.publishedAt?.toISOString(),
    },
  };
}

const NEWS_CATEGORIES: Record<string, string> = {
  announcement: 'Thông báo',
  event: 'Sự kiện',
  call_for_paper: 'Call for Papers',
  policy: 'Chính sách',
  research_news: 'Tin nghiên cứu',
  interview: 'Phỏng vấn',
  award: 'Giải thưởng',
  conference: 'Hội thảo',
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await prisma.news.findUnique({
    where: { slug: params.slug },
    include: {
      author: {
        select: {
          fullName: true,
          org: true,
          email: true,
        }
      }
    }
  });

  if (!news || !news.isPublished) {
    notFound();
  }

  // Lấy tin liên quan
  const relatedNews = await prisma.news.findMany({
    where: {
      isPublished: true,
      id: { not: news.id },
      OR: [
        { category: news.category },
        { tags: { hasSome: news.tags } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    include: {
      author: {
        select: {
          fullName: true,
        }
      }
    }
  });

  const getCategoryLabel = (category?: string | null) => {
    if (!category) return 'Chưa phân loại';
    return NEWS_CATEGORIES[category] || category;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-primary">Tin tức</Link>
          <span>/</span>
          <span className="text-foreground">{getCategoryLabel(news.category)}</span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <Badge variant="secondary" className="text-sm">
            {getCategoryLabel(news.category)}
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight">{news.title}</h1>
          
          {news.titleEn && (
            <h2 className="text-2xl text-muted-foreground italic">{news.titleEn}</h2>
          )}

          {news.summary && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {news.summary}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{news.author?.fullName}</span>
              {news.author?.org && (
                <span className="text-xs">({news.author.org})</span>
              )}
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {news.publishedAt 
                ? format(new Date(news.publishedAt), "dd 'tháng' MM, yyyy", { locale: vi })
                : format(new Date(news.createdAt), "dd 'tháng' MM, yyyy", { locale: vi })
              }
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {news.views} lượt xem
            </div>
          </div>

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {news.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Cover Image */}
        {news.coverImage && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden">
            <Image
              src={news.coverImage}
              alt={news.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </CardContent>
        </Card>

        {/* English Content */}
        {news.contentEn && (
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">English Version</h3>
              <div 
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: news.contentEn }}
              />
            </CardContent>
          </Card>
        )}

        {/* Share Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Chia sẻ bài viết
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(news.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-primary rounded"></div>
              <h2 className="text-2xl font-bold">Tin tức liên quan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedNews.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {item.coverImage ? (
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                              src={item.coverImage}
                              alt={item.title}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded flex items-center justify-center">
                            <div className="text-2xl">📰</div>
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-1">
                          <Badge variant="outline" className="text-xs mb-1">
                            {getCategoryLabel(item.category)}
                          </Badge>
                          <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {item.publishedAt 
                              ? format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })
                              : format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to News List */}
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách tin tức
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
