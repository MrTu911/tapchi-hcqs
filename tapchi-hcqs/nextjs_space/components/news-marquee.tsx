
"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

interface MarqueeNewsItem {
  id: string
  title: string
  url: string
}

export function NewsMarquee() {
  const [news, setNews] = useState<MarqueeNewsItem[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    fetchLatestNews()
  }, [])

  const fetchLatestNews = async () => {
    try {
      const res = await fetch('/api/articles?limit=5&sort=latest')
      if (res.ok) {
        const data = await res.json()
        const newsItems = data.data?.articles?.map((article: any) => ({
          id: article.id,
          title: article.submission.title,
          url: `/articles/${article.id}`
        })) || []
        setNews(newsItems)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  if (!isClient || news.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="max-w-[1280px] mx-auto bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-950 border-y-2 border-amber-300 dark:border-amber-700 py-2.5 overflow-hidden">
        <div className="px-4 sm:px-6 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
          <Newspaper className="h-4 w-4" />
          <span>Tin nổi bật</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-flex gap-10">
            {[...news, ...news].map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                href={item.url}
                className="inline-block text-sm font-medium text-amber-900 dark:text-amber-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                <span className="mr-2">•</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
