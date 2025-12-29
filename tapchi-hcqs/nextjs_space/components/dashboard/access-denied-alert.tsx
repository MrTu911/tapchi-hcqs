
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function AccessDeniedAlert() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams?.get('error')
    const attempted = searchParams?.get('attempted')

    if (error === 'access_denied' && attempted) {
      toast.error(`⛔ Bạn không có quyền truy cập vào ${attempted}`, {
        duration: 5000,
        description: 'Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập này.'
      })
      
      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  return null
}
