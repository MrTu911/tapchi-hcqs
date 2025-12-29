import Link from 'next/link'
import Image from 'next/image'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { getActiveHomepageSections } from '@/lib/homepage-sections'
import { getSignedImageUrl } from '@/lib/image-utils'

// New Modern Components
import MarqueeNewsBar from '@/components/marquee-news-bar'
import HeroBannerEnhanced from '@/components/hero-banner-enhanced'
import FeaturedArticlesSection from '@/components/featured-articles-section'
import VideoGallerySection from '@/components/video-gallery-section'
import EnhancedIssuesSidebar from '@/components/enhanced-issues-sidebar'
import ModernFooter from '@/components/modern-footer'

// Legacy Components (still used)
import NewsGridSection from '@/components/news-grid-section'
import TopicCardsSection from '@/components/topic-cards-section'
import FeaturedAuthorsWidget from '@/components/featured-authors-widget'
import TrendingTopicsWidget from '@/components/trending-topics-widget'
import CallForPapersWidget from '@/components/call-for-papers-widget'
import SearchWidget from '@/components/search-widget'
import LatestResearchCard from '@/components/latest-research-card'

// Revalidate homepage every 5 minutes (300 seconds)
export const revalidate = 300

// CSS root variables for colors
const cssVariables = `
:root {
  --army-green: #2E4A36;
  --deep-red: #C8102E;
  --deep-blue: #003366;
  --gold: #D4AF37;
  --ivory: #F8F8F8;
  --muted: #6B6B6B;
  --card-bg: #ffffff;
  --max-width: 1200px;
}
`;

// Get latest articles - Cached Prisma query
const getLatestArticles = cache(async () => {
  try {
    const articles = await prisma.article.findMany({
      where: {
        approvalStatus: 'APPROVED',
        publishedAt: {
          lte: new Date(), // Only show published articles
        },
      },
      include: {
        submission: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                org: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        issue: {
          include: {
            volume: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 20,
    })

    return articles.map(article => ({
      id: article.id,
      title: article.submission.title,
      abstractVn: article.submission.abstractVn,
      abstractEn: article.submission.abstractEn,
      keywords: article.submission.keywords,
      pdfUrl: article.pdfFile,
      author: article.submission.author,
      category: article.submission.category,
      issue: article.issue,
      publishedAt: article.publishedAt?.toISOString(),
      // Keep original submission structure for components that need it
      submission: article.submission,
    }))
  } catch (error) {
    console.error('Error fetching latest articles:', error)
    return []
  }
})

// Get active videos - Cached Prisma query
const getActiveVideos = cache(async () => {
  try {
    const videos = await prisma.video.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { displayOrder: 'asc' },
        { publishedAt: 'desc' },
      ],
      take: 6, // Show up to 6 videos on homepage
    })

    // Import getDownloadUrl for uploaded videos
    const { getDownloadUrl } = await import('@/lib/s3')

    // Process videos and get signed URLs for uploaded files
    const processedVideos = await Promise.all(
      videos.map(async (video) => {
        let videoUrl = video.videoUrl
        
        // For uploaded videos, get signed URL from S3
        if (video.videoType === 'upload' && video.cloudStoragePath) {
          try {
            videoUrl = await getDownloadUrl(video.cloudStoragePath, 7200) // 2 hours expiry
          } catch (error) {
            console.error(`Error getting signed URL for video ${video.id}:`, error)
            videoUrl = video.cloudStoragePath // Fallback to S3 key
          }
        }

        return {
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnailUrl || '/images/default-video.jpg',
          url: videoUrl,
          duration: video.duration ? formatDuration(video.duration) : undefined,
          views: video.views,
          category: video.category || undefined,
        }
      })
    )

    return processedVideos
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
})

// Helper function to format video duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Get categories - Cached Prisma query
const getCategories = cache(async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
})

// Get active banners from CMS - Cached Prisma query
const getBanners = cache(async () => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        position: 'asc',
      },
    })

    // Generate signed URLs for all banners
    const bannersWithSignedUrls = await Promise.all(
      banners.map(async (banner) => ({
        id: banner.id,
        image: await getSignedImageUrl(banner.imageUrl, 86400), // 24 hours
        title: banner.title || banner.titleEn || '',
        description: banner.subtitle || banner.subtitleEn || '',
        linkUrl: banner.linkUrl || '#',
        buttonText: banner.buttonText || 'Xem thêm',
        altText: banner.altText,
      }))
    )

    return bannersWithSignedUrls
  } catch (error) {
    console.error('Error fetching banners:', error)
    return []
  }
})

// Get latest issue - Cached Prisma query
const getLatestIssue = cache(async () => {
  try {
    const issue = await prisma.issue.findFirst({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        volume: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { number: 'desc' },
      ],
    })

    if (!issue) return null

    return {
      id: issue.id,
      title: issue.title || undefined,
      description: issue.description || undefined,
      coverImage: issue.coverImage || undefined,
      publishDate: issue.publishDate?.toISOString(),
      volume: issue.volume,
      number: issue.number,
      year: issue.year,
      _count: issue._count,
    }
  } catch (error) {
    console.error('Error fetching latest issue:', error)
    return null
  }
})

// Get recent issues - Cached Prisma query
const getRecentIssues = cache(async () => {
  try {
    const issues = await prisma.issue.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        volume: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { number: 'desc' },
      ],
      take: 6,
    })

    return issues.map(issue => ({
      id: issue.id,
      title: issue.title || undefined,
      description: issue.description || undefined,
      coverImage: issue.coverImage || undefined,
      publishDate: issue.publishDate?.toISOString(),
      volume: issue.volume,
      number: issue.number,
      year: issue.year,
      _count: issue._count,
    }))
  } catch (error) {
    console.error('Error fetching recent issues:', error)
    return []
  }
})

// Get news - Cached Prisma query with parameters
const getNews = cache(async (category?: string, featured?: boolean, limit: number = 12) => {
  try {
    const where: any = {
      isPublished: true,
    }

    if (category) {
      where.category = category
    }

    if (featured) {
      where.isFeatured = true
    }

    const news = await prisma.news.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    })

    return news.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.summary || '',
      content: item.content,
      coverImage: item.coverImage || undefined,
      category: item.category || undefined,
      isFeatured: item.isFeatured,
      publishedAt: item.publishedAt?.toISOString(),
      author: item.author || undefined,
    }))
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
})

// Get featured authors - Cached Prisma query
const getFeaturedAuthors = cache(async () => {
  try {
    // Get authors who have published articles
    const authors = await prisma.user.findMany({
      where: {
        role: 'AUTHOR',
        isActive: true,
        submissions: {
          some: {
            article: {
              isNot: null,
            },
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        academicTitle: true,
        academicDegree: true,
        org: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        submissions: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    return authors.map(author => ({
      id: author.id,
      fullName: author.fullName,
      academicTitle: author.academicTitle || undefined,
      academicDegree: author.academicDegree || undefined,
      specialization: author.org || undefined,
    }))
  } catch (error) {
    console.error('Error fetching featured authors:', error)
    return []
  }
})

export default async function HomePage() {
  // Use Promise.allSettled to handle errors gracefully
  const results = await Promise.allSettled([
    getLatestArticles(),
    getCategories(),
    getLatestIssue(),
    getRecentIssues(),
    getNews(undefined, true, 4),
    getNews(undefined, false, 4),
    getNews('call_for_paper', false, 4),
    getFeaturedAuthors(),
    getBanners(),
    getActiveHomepageSections(), // Fetch CMS sections
    getActiveVideos() // Fetch active videos
  ])

  // Extract data or use fallback values
  const latestArticles = results[0].status === 'fulfilled' ? results[0].value : []
  const categories = results[1].status === 'fulfilled' ? results[1].value : []
  const latestIssue = results[2].status === 'fulfilled' ? results[2].value : null
  const recentIssues = results[3].status === 'fulfilled' ? results[3].value : []
  const featuredNews = results[4].status === 'fulfilled' ? results[4].value : []
  const latestNews = results[5].status === 'fulfilled' ? results[5].value : []
  const specialNews = results[6].status === 'fulfilled' ? results[6].value : []
  const featuredAuthors = results[7].status === 'fulfilled' ? results[7].value : []
  const cmsBanners = results[8].status === 'fulfilled' ? results[8].value : []
  const cmsSections = results[9].status === 'fulfilled' ? results[9].value : []
  const activeVideos = results[10].status === 'fulfilled' ? results[10].value : []

  // Create a map for easy section lookup
  const sectionMap = new Map(cmsSections.map((s: any) => [s.key, s]))

  // Use CMS banners if available, otherwise fallback to issues as slider data
  let sliderData = []
  
  if (cmsBanners.length > 0) {
    // Use banners from CMS
    sliderData = cmsBanners
  } else {
    // Fallback: Prepare hero slider data from issues 2-4 (skip latest to avoid duplication)
    sliderData = recentIssues.slice(1, 4).map((issue: any, index: number) => ({
      id: issue.id,
      image: issue.coverImage || `/images/issues/default-${index + 1}.jpg`,
      title: issue.title || `Bìa số mới: Nghiên cứu quân sự và chiến lược quốc phòng`,
      description: issue.description || `Phân tích các mô hình vận tải, huấn luyện và chiến lược quân sự hiện đại.`,
      linkUrl: `/issues/${issue.id}`,
      buttonText: 'Đọc chi tiết'
    }))
  }

  // Top 4 categories for topic cards
  const topCategories = categories.slice(0, 4).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description
  }))

  // Helper function to check if section is active
  const isSectionActive = (key: string) => {
    const section = sectionMap.get(key)
    return section ? section.isActive : true // Default to true if section not found
  }

  // Transform articles for Featured Section
  const featuredArticlesData = latestArticles.slice(0, 4).map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.abstractVn?.substring(0, 150),
    coverImage: undefined, // Add cover image support if needed
    category: article.category,
    author: article.author,
    publishedAt: article.publishedAt
  }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      
      {/* Marquee News Bar */}
      <MarqueeNewsBar />
      
      {/* Main Container with max-width */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Enhanced Banner */}
        {isSectionActive('hero_banner') && (
          <section className="mt-8 mb-10">
            <HeroBannerEnhanced slides={sliderData} autoPlayInterval={6000} />
          </section>
        )}

        {/* Featured Articles Section - Main + Side Layout */}
        {isSectionActive('featured_news') && featuredArticlesData.length > 0 && (
          <FeaturedArticlesSection
            mainArticle={featuredArticlesData[0]}
            sideArticles={featuredArticlesData.slice(1)}
          />
        )}

        {/* Main Content Grid - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10 mb-10">
          {/* Left Column - News and Articles */}
          <section className="space-y-10">
            {/* Tin mới */}
            {isSectionActive('latest_news') && (
              <NewsGridSection 
                title="Tin mới" 
                news={latestNews} 
              />
            )}

            {/* Tin chuyên ngành */}
            {isSectionActive('special_news') && (
              <NewsGridSection 
                title="Tin chuyên ngành" 
                news={specialNews} 
              />
            )}

            {/* Bài nghiên cứu mới nhất */}
            {isSectionActive('latest_research') && (
              <LatestResearchCard article={latestArticles[0] || null} />
            )}
          </section>

          {/* Right Column - Enhanced Sidebar */}
          <aside className="space-y-8">
            {/* Search Box */}
            {isSectionActive('search_widget') && <SearchWidget />}

            {/* Enhanced Issues Sidebar - Show 4 latest issues */}
            {isSectionActive('latest_issue') && recentIssues.length > 0 && (
              <EnhancedIssuesSidebar issues={recentIssues.slice(0, 4)} />
            )}

            {/* Tác giả tiêu biểu */}
            {isSectionActive('featured_authors') && <FeaturedAuthorsWidget authors={featuredAuthors} />}

            {/* Chủ đề nổi bật */}
            {isSectionActive('trending_topics') && <TrendingTopicsWidget topics={[]} />}

            {/* Thông báo – Tuyển bài */}
            {isSectionActive('call_for_papers') && <CallForPapersWidget />}
          </aside>
        </div>

        {/* Video Gallery Section */}
        {isSectionActive('video_media') && (
          <div className="mb-10">
            <VideoGallerySection videos={activeVideos} />
          </div>
        )}

        {/* 4 Khối Chủ Đề Nổi Bật */}
        {isSectionActive('topic_cards') && <TopicCardsSection topics={topCategories} />}
      </div>

      {/* Modern Footer */}
      <ModernFooter />
    </div>
  )
}
