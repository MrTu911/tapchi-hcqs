
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface UserEditFormProps {
  user: {
    id: string
    fullName: string
    email: string
    phone?: string | null
    org?: string | null
    bio?: string | null
    role: string
    isActive: boolean
  }
}

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phone: user.phone || '',
    org: user.org || '',
    bio: user.bio || '',
    role: user.role,
    isActive: user.isActive
  })

  const roles = [
    { value: 'READER', label: 'Độc giả' },
    { value: 'AUTHOR', label: 'Tác giả' },
    { value: 'REVIEWER', label: 'Phản biện' },
    { value: 'SECTION_EDITOR', label: 'Biên tập viên' },
    { value: 'MANAGING_EDITOR', label: 'Thư ký tòa soạn' },
    { value: 'EIC', label: 'Tổng biên tập' },
    { value: 'LAYOUT_EDITOR', label: 'Biên tập bố cục' },
    { value: 'SYSADMIN', label: 'Quản trị viên' },
    { value: 'SECURITY_AUDITOR', label: 'Kiểm định bảo mật' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
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

      toast.success('Cập nhật người dùng thành công!')
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
          placeholder="Giới thiệu ngắn về người dùng..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Vai trò *</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Trạng thái hoạt động</Label>
          <p className="text-sm text-muted-foreground">
            Cho phép người dùng đăng nhập và sử dụng hệ thống
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cập nhật người dùng
      </Button>
    </form>
  )
}
