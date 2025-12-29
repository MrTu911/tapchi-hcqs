

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams?.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Token xác thực không hợp lệ')
      return
    }

    // Call verification API
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success')
          setMessage(data.message || 'Xác thực email thành công!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Xác thực email thất bại')
        }
      })
      .catch(error => {
        setStatus('error')
        setMessage('Có lỗi xảy ra khi xác thực email')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Xác thực Email
          </CardTitle>
          <CardDescription className="text-center">
            Tạp chí điện tử Khoa học Hậu cần Quân sự
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Đang xác thực email của bạn...
              </p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {message}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/auth/login">
                    Đăng nhập
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/">
                    Về trang chủ
                  </Link>
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <Alert variant="destructive">
                  <AlertDescription>
                    {message}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/auth/register">
                    Đăng ký lại
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/">
                    Về trang chủ
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
