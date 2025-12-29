
/**
 * Article Metrics Display Component
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, Quote, TrendingUp } from 'lucide-react'

interface ArticleMetricsProps {
  articleId: string
}

export function ArticleMetricsCard({ articleId }: ArticleMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [articleId])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/metrics/article/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê bài viết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  const stats = [
    {
      label: 'Lượt xem',
      value: metrics.views,
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      label: 'Tải xuống',
      value: metrics.downloads,
      icon: Download,
      color: 'text-green-500'
    },
    {
      label: 'Trích dẫn',
      value: metrics.citations,
      icon: Quote,
      color: 'text-purple-500'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Thống kê bài viết
        </CardTitle>
        <CardDescription>
          Cập nhật lần cuối:{' '}
          {metrics.updatedAt
            ? new Date(metrics.updatedAt).toLocaleDateString('vi-VN')
            : 'Chưa có'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {metrics.viewsByCountry && Object.keys(metrics.viewsByCountry).length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Top quốc gia</h4>
            <div className="space-y-2">
              {Object.entries(metrics.viewsByCountry)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 5)
                .map(([country, count]: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{country || 'Không xác định'}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
