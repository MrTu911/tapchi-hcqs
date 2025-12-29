
/**
 * Admin Integrations Dashboard
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(false)

  const integrations = [
    {
      name: 'ORCID',
      description: 'Đồng bộ hồ sơ tác giả và phản biện viên',
      status: 'active',
      endpoint: '/api/auth/orcid',
      docs: 'https://orcid.org/organizations/integrators'
    },
    {
      name: 'CrossRef DOI',
      description: 'Đăng ký và quản lý DOI cho bài báo',
      status: 'active',
      endpoint: '/api/doi/register',
      docs: 'https://www.crossref.org/documentation/'
    },
    {
      name: 'iThenticate',
      description: 'Kiểm tra đạo văn tự động',
      status: process.env.NEXT_PUBLIC_ITHENTICATE_ENABLED === 'true' ? 'active' : 'inactive',
      endpoint: '/api/plagiarism',
      docs: 'https://www.ithenticate.com/api'
    },
    {
      name: 'Semantic Search',
      description: 'Tìm kiếm thông minh sử dụng AI',
      status: 'active',
      endpoint: '/api/search/semantic',
      docs: null
    },
    {
      name: 'AI Reviewer Matching',
      description: 'Gợi ý phản biện viên phù hợp tự động',
      status: 'active',
      endpoint: '/api/reviewers/match',
      docs: null
    },
    {
      name: 'Web Push Notifications',
      description: 'Thông báo realtime qua trình duyệt',
      status: 'active',
      endpoint: '/api/push/subscribe',
      docs: null
    },
    {
      name: 'Public API',
      description: 'API công khai cho dữ liệu bài báo',
      status: 'active',
      endpoint: '/api/public/articles',
      docs: null
    },
    {
      name: 'Cron Jobs',
      description: 'Tự động hóa: nhắc nhở, metrics, retention',
      status: 'active',
      endpoint: '/api/cron/run-jobs',
      docs: null
    }
  ]

  const testIntegration = async (endpoint: string, name: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      if (response.ok || response.status === 400) {
        toast.success(`${name} đang hoạt động`)
      } else {
        toast.error(`${name} không phản hồi`)
      }
    } catch (error) {
      toast.error(`Lỗi kết nối ${name}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Hoạt động
          </Badge>
        )
      case 'inactive':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Không hoạt động
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Đang xử lý
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tích hợp & Tính năng nâng cao</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý các tích hợp bên thứ ba và tính năng AI
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription className="mt-1.5">
                    {integration.description}
                  </CardDescription>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testIntegration(integration.endpoint, integration.name)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Kiểm tra
                </Button>
                {integration.docs && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(integration.docs!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tài liệu
                  </Button>
                )}
                <code className="text-xs text-muted-foreground ml-auto">
                  {integration.endpoint}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình môi trường</CardTitle>
          <CardDescription>
            Các biến môi trường cần thiết cho integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="grid grid-cols-3 gap-4 text-muted-foreground">
              <span>ORCID_CLIENT_ID</span>
              <span>ORCID_CLIENT_SECRET</span>
              <span>ORCID_SANDBOX</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-muted-foreground">
              <span>CROSSREF_LOGIN_ID</span>
              <span>CROSSREF_PASSWORD</span>
              <span>CROSSREF_TEST_MODE</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-muted-foreground">
              <span>ITHENTICATE_API_KEY</span>
              <span>ITHENTICATE_ENABLED</span>
              <span>VAPID_PUBLIC_KEY</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
