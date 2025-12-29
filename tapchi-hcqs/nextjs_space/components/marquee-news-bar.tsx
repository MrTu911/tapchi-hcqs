'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface MarqueeNewsBarProps {
  newsItems?: Array<{
    id: string
    title: string
    url?: string
    isImportant?: boolean
  }>
}

export default function MarqueeNewsBar({ newsItems = [] }: MarqueeNewsBarProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Default news if none provided
  const defaultNews = [
    {
      id: '1',
      title: '🔴 Thông báo: Tạp chí mở rộng nhận bài nghiên cứu về ứng dụng AI trong huấn luyện hậu cần quân sự',
      isImportant: true
    },
    {
      id: '2',
      title: '📢 Hội thảo Khoa học Quốc phòng 2025 - Đẩy mạnh nghiên cứu công nghệ trong quân sự hiện đại',
      isImportant: false
    },
    {
      id: '3',
      title: '⭐ Số mới nhất đã phát hành: Chiến lược Hậu cần trong thời đại số',
      isImportant: false
    }
  ]

  const displayNews = newsItems.length > 0 ? newsItems : defaultNews
  const newsText = displayNews.map(item => item.title).join('   •   ')

  if (!isClient) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-[#2C5530] via-[#295232] to-[#2C5530] text-yellow-300 py-2.5 overflow-hidden relative border-b-2 border-yellow-400/30 shadow-lg">
      <div className="absolute inset-0 bg-[url('/patterns/military-pattern.svg')] opacity-5"></div>
      <div className="relative flex items-center gap-3 px-4">
        <div className="flex-shrink-0 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Tin nổi bật</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap text-sm font-semibold">
            {newsText}
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
          display: inline-block;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
