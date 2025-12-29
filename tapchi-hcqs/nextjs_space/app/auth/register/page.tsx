
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Info, Upload, FileText, X } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    org: '',
    phone: '',
    role: 'AUTHOR',
    academicTitle: '',
    academicDegree: '',
    position: '',
    rank: ''
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [workCardFile, setWorkCardFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'workcard') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Kích thước file không được vượt quá 5MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file PDF, DOC, DOCX, JPG, PNG')
      return
    }

    if (type === 'cv') {
      setCvFile(file)
      toast.success('Đã chọn file CV')
    } else {
      setWorkCardFile(file)
      toast.success('Đã chọn file thẻ công tác')
    }
  }

  const removeFile = (type: 'cv' | 'workcard') => {
    if (type === 'cv') {
      setCvFile(null)
    } else {
      setWorkCardFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    setIsLoading(true)

    try {
      // Build FormData for file uploads
      const formDataToSend = new FormData()
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('role', formData.role)
      
      if (formData.org) formDataToSend.append('org', formData.org)
      if (formData.phone) formDataToSend.append('phone', formData.phone)
      if (formData.academicTitle) formDataToSend.append('academicTitle', formData.academicTitle)
      if (formData.academicDegree) formDataToSend.append('academicDegree', formData.academicDegree)
      if (formData.position) formDataToSend.append('position', formData.position)
      if (formData.rank) formDataToSend.append('rank', formData.rank)
      
      // Append files if selected
      if (cvFile) formDataToSend.append('cvFile', cvFile)
      if (workCardFile) formDataToSend.append('workCardFile', workCardFile)

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại')
      }

      toast.success(data.message || 'Đăng ký thành công! Vui lòng chờ Ban biên tập phê duyệt.')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản mới để tham gia hệ thống Tạp chí điện tử
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Sau khi đăng ký, tài khoản của bạn sẽ được Ban biên tập xem xét và phê duyệt trước khi có thể sử dụng.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    type="text"
                    value={formData.org}
                    onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                    placeholder="Học viện Hậu cần"
                  />
                </div>
              </div>
            </div>

            {/* Vai trò đăng ký */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vai trò</h3>
              
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò mong muốn *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTHOR">Tác giả</SelectItem>
                    <SelectItem value="REVIEWER">Phản biện</SelectItem>
                    <SelectItem value="SECTION_EDITOR">Biên tập viên</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Vai trò này sẽ được xem xét bởi Ban biên tập khi duyệt tài khoản
                </p>
              </div>
            </div>

            {/* Thông tin học thuật */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin học thuật (Tùy chọn)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicDegree">Học vị</Label>
                  <Input
                    id="academicDegree"
                    type="text"
                    value={formData.academicDegree}
                    onChange={(e) => setFormData({ ...formData, academicDegree: e.target.value })}
                    placeholder="Tiến sĩ, Thạc sĩ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicTitle">Học hàm</Label>
                  <Input
                    id="academicTitle"
                    type="text"
                    value={formData.academicTitle}
                    onChange={(e) => setFormData({ ...formData, academicTitle: e.target.value })}
                    placeholder="Giáo sư, Phó Giáo sư..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rank">Cấp bậc</Label>
                  <Input
                    id="rank"
                    type="text"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="Thiếu tá, Trung tá..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Chức vụ</Label>
                  <Input
                    id="position"
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Trưởng khoa, Phó trưởng bộ môn..."
                  />
                </div>
              </div>
            </div>

            {/* File uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tài liệu minh chứng (Tùy chọn)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CV Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cvFile">File CV</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        id="cvFile"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'cv')}
                        className="cursor-pointer"
                        disabled={!!cvFile}
                      />
                    </div>
                    {cvFile && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm truncate">{cvFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => removeFile('cv')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG (tối đa 5MB)
                  </p>
                </div>

                {/* Work Card Upload */}
                <div className="space-y-2">
                  <Label htmlFor="workCardFile">Thẻ công tác</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        id="workCardFile"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'workcard')}
                        className="cursor-pointer"
                        disabled={!!workCardFile}
                      />
                    </div>
                    {workCardFile && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm truncate">{workCardFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => removeFile('workcard')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG (tối đa 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mật khẩu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Đã có tài khoản? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Đăng nhập
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
