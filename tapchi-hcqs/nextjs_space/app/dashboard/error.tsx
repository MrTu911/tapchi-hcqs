
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-6 w-6" />
            Có lỗi xảy ra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-800">
            Đã xảy ra lỗi khi tải dashboard. Vui lòng thử lại.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <pre className="p-4 bg-red-100 rounded text-xs overflow-auto">
              {error.message}
            </pre>
          )}

          {error.digest && (
            <p className="text-xs text-red-600 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-4">
            <Button onClick={reset} variant="destructive">
              Thử lại
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Làm mới trang
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
