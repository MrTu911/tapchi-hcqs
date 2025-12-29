
"use client"

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ')
      return
    }

    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Đăng ký thành công! Bạn sẽ nhận được thông báo khi có số mới.')
      setEmail('')
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className="shadow-lg border-2 border-emerald-100 dark:border-emerald-900">
      <CardHeader className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Nhận bản tin</CardTitle>
            <CardDescription>Cập nhật số mới nhất</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email của bạn..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-white dark:bg-gray-900"
          />
          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký ngay'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Chúng tôi tôn trọng quyền riêng tư của bạn
        </p>
      </CardContent>
    </Card>
  )
}
