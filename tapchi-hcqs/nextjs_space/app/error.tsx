
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center space-y-6 p-8 max-w-lg">
        <div className="flex justify-center">
          <AlertTriangle className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Có lỗi xảy ra
          </h1>
          <p className="text-gray-600">
            Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}
