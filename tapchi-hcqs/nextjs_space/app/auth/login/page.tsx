
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Show session/token related messages
  useEffect(() => {
    const reason = searchParams?.get('reason')
    const error = searchParams?.get('error')
    
    if (reason === 'no_token') {
      toast.info('Vui lòng đăng nhập để tiếp tục')
    } else if (reason === 'invalid_token') {
      toast.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.')
    } else if (error === 'access_denied') {
      const attempted = searchParams?.get('attempted')
      toast.error(`Bạn không có quyền truy cập vào ${attempted}`)
    }
  }, [searchParams])

  const getRoleDashboard = (role: string) => {
    const roleMap: Record<string, string> = {
      'SYSADMIN': '/dashboard/admin',
      'EIC': '/dashboard/eic',
      'MANAGING_EDITOR': '/dashboard/managing',
      'SECTION_EDITOR': '/dashboard/editor',
      'EDITOR': '/dashboard/editor',
      'REVIEWER': '/dashboard/reviewer',
      'AUTHOR': '/dashboard/author',
      'SECURITY_AUDITOR': '/dashboard/security',
      'LAYOUT_EDITOR': '/dashboard/layout',
      'READER': '/dashboard/author'
    }
    return roleMap[role] || '/dashboard/author'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại')
      }

      toast.success('Đăng nhập thành công!')
      
      // Redirect to the appropriate dashboard based on user role
      const from = searchParams?.get('from')
      const targetUrl = from && from.startsWith('/dashboard') 
        ? from 
        : getRoleDashboard(data.data?.user?.role)
      
      // Use window.location.href for hard navigation to ensure cookies are properly loaded
      window.location.href = targetUrl
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Đăng nhập vào hệ thống Tạp chí HCQS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mật khẩu</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">Tài khoản test:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>• Admin: admin@tapchinckhhcqs.vn / TapChi@2025</p>
              <p>• Tổng BT: tongbientap@tapchinckhhcqs.vn / TapChi@2025</p>
              <p>• BT Chính: bientapchinh@tapchinckhhcqs.vn / TapChi@2025</p>
              <p>• BT Chuyên mục: bientap@tapchinckhhcqs.vn / TapChi@2025</p>
              <p>• Tác giả: tacgia@tapchinckhhcqs.vn / TapChi@2025</p>
              <p>• Phản biện: phanbien@tapchinckhhcqs.vn / TapChi@2025</p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Chưa có tài khoản? </span>
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <Link href="/" className="text-muted-foreground hover:underline">
              Quay về trang chủ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
