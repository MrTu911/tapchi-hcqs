
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSignedImageUrl } from '@/lib/image-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Eye, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const metadata: Metadata = {
  title: 'Tin tức - Tạp chí điện tử Khoa học Hậu cần quân sự',
  description: 'Tin tức, thông báo, sự kiện và hoạt động khoa học của Tạp chí điện tử Khoa học Hậu cần quân sự',
};

const NEWS_CATEGORIES = [
  { value: 'announcement', label: 'Thông báo' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'call_for_paper', label: 'Call for Papers' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'research_news', label: 'Tin nghiên cứu' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'award', label: 'Giải thưởng' },
  { value: 'conference', label: 'Hội thảo' },
];

export const revalidate = 300; // 5 phút

export default async function NewsListPage() {
  // Fetch tin nổi bật
  const featuredNews = await prisma.news.findMany({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: {
      author: {
        select: {
          fullName: true,
          org: true,
        }
      }
    }
  });

  // Fetch tất cả tin đã publish
  const allNews = await prisma.news.findMany({
    where: {
      isPublished: true,
    },
    orderBy: [
      { publishedAt: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 20,
    include: {
      author: {
        select: {
          fullName: true,
          org: true,
        }
      }
    }
  });

  // Add signed URLs for cover images
  const featuredNewsWithUrls = await Promise.all(
    featuredNews.map(async (news) => ({
      ...news,
      coverImageSigned: news.coverImage 
        ? await getSignedImageUrl(news.coverImage, 86400) 
        : null
    }))
  );

  const allNewsWithUrls = await Promise.all(
    allNews.map(async (news) => ({
      ...news,
      coverImageSigned: news.coverImage 
        ? await getSignedImageUrl(news.coverImage, 86400) 
        : null
    }))
  );

  const getCategoryLabel = (category?: string | null) => {
    if (!category) return 'Chưa phân loại';
    const found = NEWS_CATEGORIES.find(c => c.value === category);
    return found?.label || category;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Tin tức & Thông báo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Cập nhật tin tức, thông báo, sự kiện và hoạt động nghiên cứu khoa học mới nhất
        </p>
      </div>

      {/* Tin nổi bật */}
      {featuredNewsWithUrls.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary rounded"></div>
            <h2 className="text-2xl font-bold">Tin nổi bật</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredNewsWithUrls.map((news) => (
              <Link key={news.id} href={`/news/${news.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {(news.coverImageSigned || news.coverImage) ? (
                    <div className="relative aspect-video w-full">
                      <Image
                        src={news.coverImageSigned || news.coverImage || ''}
                        alt={news.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-t-lg flex items-center justify-center">
                      <div className="text-4xl font-bold text-emerald-200">📰</div>
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <Badge variant="secondary">{getCategoryLabel(news.category)}</Badge>
                    <h3 className="font-bold text-lg line-clamp-2">{news.title}</h3>
                    {news.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {news.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {news.publishedAt 
                          ? format(new Date(news.publishedAt), 'dd/MM/yyyy', { locale: vi })
                          : format(new Date(news.createdAt), 'dd/MM/yyyy', { locale: vi })
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {news.views}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tất cả tin tức */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-primary rounded"></div>
            <h2 className="text-2xl font-bold">Tất cả tin tức</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allNewsWithUrls.map((news) => (
            <Link key={news.id} href={`/news/${news.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {(news.coverImageSigned || news.coverImage) ? (
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={news.coverImageSigned || news.coverImage || ''}
                          alt={news.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg flex items-center justify-center">
                        <div className="text-3xl">📰</div>
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(news.category)}
                        </Badge>
                        {news.isFeatured && (
                          <Badge className="text-xs bg-yellow-500">Nổi bật</Badge>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg line-clamp-2">{news.title}</h3>
                      
                      {news.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {news.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {news.author?.fullName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {news.publishedAt 
                            ? format(new Date(news.publishedAt), 'dd/MM/yyyy', { locale: vi })
                            : format(new Date(news.createdAt), 'dd/MM/yyyy', { locale: vi })
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {news.views}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {allNewsWithUrls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chưa có tin tức nào được công bố</p>
          </div>
        )}
      </section>
    </div>
  );
}
