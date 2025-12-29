
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface News {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  coverImage?: string;
  category?: string;
  publishedAt: string;
  views: number;
}

interface NewsListWidgetProps {
  title?: string;
  category?: string;
  limit?: number;
  featured?: boolean;
}

export default function NewsListWidget({
  title = 'Tin tức & Thông báo',
  category,
  limit = 6,
  featured = false,
}: NewsListWidgetProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, [category, limit, featured]);

  const fetchNews = async () => {
    try {
      const params = new URLSearchParams({
        published: 'true',
        limit: limit.toString(),
      });

      if (category) {
        params.append('category', category);
      }

      if (featured) {
        params.append('featured', 'true');
      }

      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href="/news">
          <Button variant="ghost" size="sm">
            Xem tất cả
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <Link href={`/news/${item.slug}`}>
              {item.coverImage && (
                <div className="relative aspect-video bg-muted">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="object-cover w-full h-full rounded-t-lg"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {item.category && (
                    <Badge variant="secondary">{item.category}</Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.publishedAt), 'dd/MM/yyyy', { locale: vi })}
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  {item.title}
                </CardTitle>
              </CardHeader>
              {item.summary && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                    <Eye className="h-3 w-3" />
                    {item.views} lượt xem
                  </div>
                </CardContent>
              )}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
