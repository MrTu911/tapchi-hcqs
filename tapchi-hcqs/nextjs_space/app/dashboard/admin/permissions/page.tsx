
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Shield, Loader2, CheckCircle2, XCircle, Download, Upload, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
  isGranted?: boolean
}

const ROLES = [
  { value: 'READER', label: 'Độc giả' },
  { value: 'AUTHOR', label: 'Tác giả' },
  { value: 'REVIEWER', label: 'Phản biện viên' },
  { value: 'SECTION_EDITOR', label: 'Biên tập viên chuyên mục' },
  { value: 'LAYOUT_EDITOR', label: 'Biên tập dàn trang' },
  { value: 'MANAGING_EDITOR', label: 'Tổng biên tập điều hành' },
  { value: 'EIC', label: 'Tổng biên tập' },
  { value: 'SECURITY_AUDITOR', label: 'Kiểm định viên bảo mật' },
  { value: 'SYSADMIN', label: 'Quản trị hệ thống' }
]

const CATEGORIES = [
  { value: 'all', label: 'Tất cả', color: 'bg-slate-500' },
  { value: 'CONTENT', label: 'Quản lý nội dung', color: 'bg-blue-500' },
  { value: 'WORKFLOW', label: 'Quy trình', color: 'bg-purple-500' },
  { value: 'USERS', label: 'Người dùng', color: 'bg-green-500' },
  { value: 'CMS', label: 'CMS', color: 'bg-pink-500' },
  { value: 'SYSTEM', label: 'Hệ thống', color: 'bg-orange-500' },
  { value: 'SECURITY', label: 'Bảo mật', color: 'bg-red-500' },
  { value: 'ANALYTICS', label: 'Thống kê', color: 'bg-indigo-500' }
]

export default function PermissionsManagementPage() {
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState('AUTHOR')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    loadPermissions()
  }, [selectedRole, selectedCategory])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/permissions/role?role=${selectedRole}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`
      )
      const data = await response.json()

      if (data.success) {
        setPermissions(data.permissions || [])
      } else {
        toast.error(data.error || 'Không thể tải danh sách quyền')
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
      toast.error('Đã xảy ra lỗi khi tải danh sách quyền')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = async (permissionId: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/permissions/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          permissionId,
          isGranted: !currentValue
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setPermissions(prev =>
          prev.map(p =>
            p.id === permissionId ? { ...p, isGranted: !currentValue } : p
          )
        )
        toast.success('Đã cập nhật quyền thành công')
      } else {
        toast.error(data.error || 'Không thể cập nhật quyền')
      }
    } catch (error) {
      console.error('Failed to toggle permission:', error)
      toast.error('Đã xảy ra lỗi khi cập nhật quyền')
    }
  }

  const handleSeedPermissions = async () => {
    try {
      setSeeding(true)
      const response = await fetch('/api/permissions/seed', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success || data.count >= 0) {
        toast.success(data.message || 'Đã khởi tạo permissions thành công')
        loadPermissions()
      } else {
        toast.error(data.error || 'Không thể khởi tạo permissions')
      }
    } catch (error) {
      console.error('Failed to seed permissions:', error)
      toast.error('Đã xảy ra lỗi khi khởi tạo permissions')
    } finally {
      setSeeding(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat ? (
      <Badge className={cn(cat.color, 'text-white')}>
        {cat.label}
      </Badge>
    ) : (
      <Badge variant="outline">{category}</Badge>
    )
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Quản lý Quyền RBAC (Ma trận)
          </h1>
          <p className="text-muted-foreground mt-1">
            Cấu hình quyền truy cập theo vai trò
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadPermissions}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={handleSeedPermissions}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Khởi tạo Permissions
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân loại</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phân loại" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Quyền của {ROLES.find(r => r.value === selectedRole)?.label}
          </CardTitle>
          <CardDescription>
            Bật/tắt quyền truy cập cho vai trò này
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Chưa có permissions nào trong hệ thống
              </p>
              <Button onClick={handleSeedPermissions} disabled={seeding}>
                {seeding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Khởi tạo Permissions
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    {getCategoryBadge(category)}
                    <span className="text-sm text-muted-foreground">
                      ({perms.length} quyền)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Mã quyền</TableHead>
                          <TableHead>Tên quyền</TableHead>
                          <TableHead>Mô tả</TableHead>
                          <TableHead className="text-center w-[120px]">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {perms.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell className="font-mono text-sm">
                              {permission.code}
                            </TableCell>
                            <TableCell className="font-medium">
                              {permission.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {permission.description || '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={permission.isGranted || false}
                                  onCheckedChange={() =>
                                    handleTogglePermission(
                                      permission.id,
                                      permission.isGranted || false
                                    )
                                  }
                                />
                                {permission.isGranted ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
