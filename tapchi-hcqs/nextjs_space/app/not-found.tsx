
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <FileQuestion className="h-24 w-24 text-gray-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Không tìm thấy trang
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/">
              Về trang chủ
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">
              Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
