
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  date: string
  url: string
  type: 'event' | 'news' | 'announcement'
}

export function AnnouncementsWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Mock data - in production, fetch from API
    setAnnouncements([
      {
        id: '1',
        title: 'Hội thảo khoa học quốc gia về Hậu cần Quân sự 2025',
        date: '2025-12-15',
        url: '#',
        type: 'event'
      },
      {
        id: '2',
        title: 'Phát hành số chuyên đề: Chuỗi cung ứng Quốc phòng',
        date: '2025-11-01',
        url: '/issues/latest',
        type: 'news'
      },
      {
        id: '3',
        title: 'Thông báo về quy trình phản biện mới',
        date: '2025-10-20',
        url: '/publishing-process',
        type: 'announcement'
      }
    ])
  }, [])

  if (!isClient) {
    return null
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'news':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">Thông báo</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {announcements.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all group"
            >
              <div className="flex items-start gap-2 mb-2">
                <Badge className={getBadgeColor(item.type)}>
                  {item.type === 'event' ? 'Sự kiện' : item.type === 'news' ? 'Tin tức' : 'Thông báo'}
                </Badge>
              </div>
              <h4 className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(item.date).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
