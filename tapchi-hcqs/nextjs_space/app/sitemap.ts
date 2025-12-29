
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * Dynamic Sitemap Generation
 * Tự động tạo sitemap.xml cho Google Scholar và các công cụ tìm kiếm
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tapchinckhhcqs.abacusai.app';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/publishing-process`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/license`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/issues`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic public pages
  const publicPages = await prisma.publicPage.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true }
  });

  const publicPagesSitemap: MetadataRoute.Sitemap = publicPages.map((page) => ({
    url: `${baseUrl}/pages/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Published articles - Get from Article model
  const publishedArticles = await prisma.article.findMany({
    where: { 
      publishedAt: { not: null }
    },
    select: {
      id: true,
      publishedAt: true,
      submission: {
        select: {
          title: true
        }
      }
    },
    orderBy: { publishedAt: 'desc' },
    take: 100
  });

  const articlesSitemap: MetadataRoute.Sitemap = publishedArticles.map((article) => ({
    url: `${baseUrl}/articles/${article.id}`,
    lastModified: article.publishedAt || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Published issues
  const issues = await prisma.issue.findMany({
    where: { status: 'PUBLISHED' },
    select: { 
      id: true,
      number: true,
      volume: { select: { volumeNo: true } },
      createdAt: true
    },
    orderBy: [
      { volume: { volumeNo: 'desc' } },
      { number: 'desc' }
    ]
  });

  const issuesSitemap: MetadataRoute.Sitemap = issues.map((issue) => ({
    url: `${baseUrl}/issues/${issue.volume.volumeNo}/${issue.number}`,
    lastModified: issue.createdAt,
    changeFrequency: 'yearly' as const,
    priority: 0.8,
  }));

  // News articles
  const newsArticles = await prisma.news.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' }
  });

  const newsSitemap: MetadataRoute.Sitemap = newsArticles.map((news) => ({
    url: `${baseUrl}/news/${news.slug}`,
    lastModified: news.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...publicPagesSitemap,
    ...articlesSitemap,
    ...issuesSitemap,
    ...newsSitemap,
  ];
}
