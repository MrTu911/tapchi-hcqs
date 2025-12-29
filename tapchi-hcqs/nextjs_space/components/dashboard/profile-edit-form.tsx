
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileEditFormProps {
  user: {
    id: string
    fullName: string
    email: string
    phone?: string | null
    org?: string | null
    bio?: string | null
  }
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phone: user.phone || '',
    org: user.org || '',
    bio: user.bio || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Cập nhật thất bại')
      }

      toast.success('Cập nhật thông tin thành công!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Họ và tên *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email không thể thay đổi. Liên hệ quản trị viên nếu cần.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="0912345678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org">Đơn vị công tác</Label>
        <Input
          id="org"
          value={formData.org}
          onChange={(e) => setFormData({ ...formData, org: e.target.value })}
          placeholder="Học viện Hậu cần"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Giới thiệu</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Giới thiệu ngắn về bản thân, lĩnh vực nghiên cứu..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cập nhật thông tin
      </Button>
    </form>
  )
}
