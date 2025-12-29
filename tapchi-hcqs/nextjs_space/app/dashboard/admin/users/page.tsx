
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  UserCheck, 
  UserX, 
  Search, 
  Loader2, 
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Award,
  Briefcase,
  Shield,
  TrendingUp,
  Users,
  UserPlus,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface User {
  id: string
  fullName: string
  email: string
  phone?: string
  org?: string
  requestedRole?: string
  role: string
  status: string
  isActive: boolean
  emailVerified?: boolean
  rank?: string
  position?: string
  academicTitle?: string
  academicDegree?: string
  cvUrl?: string
  workCardUrl?: string
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

interface UserStats {
  summary: {
    total: number
    pending: number
    approved: number
    rejected: number
    emailVerified: number
    emailUnverified: number
    approvalRate: number
    rejectionRate: number
  }
  byRole: Array<{ role: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  recentPending: User[]
}

const roleLabels: Record<string, string> = {
  AUTHOR: 'Tác giả',
  REVIEWER: 'Phản biện',
  SECTION_EDITOR: 'Biên tập viên',
  MANAGING_EDITOR: 'Biên tập điều hành',
  EIC: 'Tổng biên tập',
  LAYOUT_EDITOR: 'Biên tập trình bày',
  SYSADMIN: 'Quản trị viên',
  READER: 'Độc giả'
}

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [approveDialog, setApproveDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [bulkApproveDialog, setBulkApproveDialog] = useState(false)
  const [bulkRejectDialog, setBulkRejectDialog] = useState(false)
  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch statistics
  useEffect(() => {
    fetchStats()
  }, [])

  // Fetch users when tab changes
  useEffect(() => {
    fetchUsers()
  }, [activeTab])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/users/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/pending?status=${activeTab}`)
      const data = await res.json()
      if (data.success) {
        setUsers(Array.isArray(data.data?.users) ? data.data.users : [])
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedUser) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'APPROVE',
          role: selectedRole || selectedUser.requestedRole || 'AUTHOR'
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Phê duyệt tài khoản thành công')
        setApproveDialog(false)
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi khi phê duyệt tài khoản')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return
    
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: 'REJECT',
          rejectionReason
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Đã từ chối tài khoản')
        setRejectDialog(false)
        setRejectionReason('')
        fetchUsers()
        fetchStats()
      } else {
        toast.error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi khi từ chối tài khoản')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return

    setActionLoading(true)
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch('/api/admin/users/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            action: 'APPROVE',
            role: selectedRole || 'AUTHOR'
          })
        })
      )

      await Promise.all(promises)
      
      toast.success(`Đã phê duyệt ${selectedUsers.size} tài khoản`)
      setBulkApproveDialog(false)
      setSelectedUsers(new Set())
      fetchUsers()
      fetchStats()
    } catch (error) {
      toast.error('Lỗi khi phê duyệt hàng loạt')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) return

    setActionLoading(true)
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        fetch('/api/admin/users/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            action: 'REJECT',
            rejectionReason
          })
        })
      )

      await Promise.all(promises)
      
      toast.success(`Đã từ chối ${selectedUsers.size} tài khoản`)
      setBulkRejectDialog(false)
      setSelectedUsers(new Set())
      setRejectionReason('')
      fetchUsers()
      fetchStats()
    } catch (error) {
      toast.error('Lỗi khi từ chối hàng loạt')
    } finally {
      setActionLoading(false)
    }
  }

  // Filter users based on search term
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.org?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Chờ duyệt</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" /> Đã duyệt</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h2>
        <p className="text-muted-foreground">
          Phê duyệt, từ chối và quản lý tài khoản người dùng
        </p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.summary.emailVerified} đã xác thực email
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.pending}</div>
              <p className="text-xs text-muted-foreground">
                Cần xử lý
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã phê duyệt</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.approved}</div>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ: {stats.summary.approvalRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ: {stats.summary.rejectionRate}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>Xem và quản lý tài khoản đăng ký</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedUsers.size > 0 ? (
                <>
                  <Button
                    onClick={() => setBulkApproveDialog(true)}
                    variant="default"
                    size="sm"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Phê duyệt ({selectedUsers.size})
                  </Button>
                  <Button
                    onClick={() => setBulkRejectDialog(true)}
                    variant="destructive"
                    size="sm"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Từ chối ({selectedUsers.size})
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = '/dashboard/admin/users/create'}
                  variant="default"
                  size="sm"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tạo người dùng mới
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="PENDING">
                  Chờ duyệt
                  {stats && <Badge className="ml-2" variant="secondary">{stats.summary.pending}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="APPROVED">
                  Đã duyệt
                  {stats && <Badge className="ml-2" variant="default">{stats.summary.approved}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="REJECTED">
                  Đã từ chối
                  {stats && <Badge className="ml-2" variant="destructive">{stats.summary.rejected}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
              </TabsList>

              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có người dùng nào
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {activeTab === 'PENDING' && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                              onCheckedChange={toggleAllUsers}
                            />
                          </TableHead>
                        )}
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vai trò mong muốn</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Xác thực email</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày đăng ký</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          {activeTab === 'PENDING' && (
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {roleLabels[user.requestedRole || user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {user.org || '-'}
                          </TableCell>
                          <TableCell>
                            {user.emailVerified ? (
                              <Badge variant="default" className="gap-1 bg-green-500">
                                <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" /> Chưa xác thực
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setDetailDialog(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setSelectedRole(user.requestedRole || 'AUTHOR')
                                      setApproveDialog(true)
                                    }}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setRejectDialog(true)
                                    }}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Họ tên</Label>
                  <p className="font-medium">{selectedUser.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {selectedUser.phone && (
                <div>
                  <Label className="text-muted-foreground">Số điện thoại</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                </div>
              )}

              {selectedUser.org && (
                <div>
                  <Label className="text-muted-foreground">Đơn vị công tác</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedUser.org}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedUser.academicDegree && (
                  <div>
                    <Label className="text-muted-foreground">Học vị</Label>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedUser.academicDegree}</p>
                    </div>
                  </div>
                )}
                {selectedUser.academicTitle && (
                  <div>
                    <Label className="text-muted-foreground">Học hàm</Label>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedUser.academicTitle}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedUser.rank && (
                  <div>
                    <Label className="text-muted-foreground">Cấp bậc</Label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedUser.rank}</p>
                    </div>
                  </div>
                )}
                {selectedUser.position && (
                  <div>
                    <Label className="text-muted-foreground">Chức vụ</Label>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{selectedUser.position}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Vai trò mong muốn</Label>
                  <Badge variant="outline">
                    {roleLabels[selectedUser.requestedRole || selectedUser.role]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div>{getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Xác thực email</Label>
                <div>
                  {selectedUser.emailVerified ? (
                    <Badge variant="default" className="gap-1 bg-green-500">
                      <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> Chưa xác thực
                    </Badge>
                  )}
                </div>
              </div>

              {selectedUser.cvUrl && (
                <div>
                  <Label className="text-muted-foreground">File CV</Label>
                  <Button variant="outline" size="sm" className="mt-1" asChild>
                    <a href={`/api/files/download?key=${selectedUser.cvUrl}`} target="_blank" rel="noopener noreferrer">
                      Xem CV
                    </a>
                  </Button>
                </div>
              )}

              {selectedUser.workCardUrl && (
                <div>
                  <Label className="text-muted-foreground">Thẻ công tác</Label>
                  <Button variant="outline" size="sm" className="mt-1" asChild>
                    <a href={`/api/files/download?key=${selectedUser.workCardUrl}`} target="_blank" rel="noopener noreferrer">
                      Xem thẻ công tác
                    </a>
                  </Button>
                </div>
              )}

              {selectedUser.rejectionReason && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Lý do từ chối:</strong> {selectedUser.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-muted-foreground">Ngày đăng ký</Label>
                <p className="font-medium">
                  {format(new Date(selectedUser.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phê duyệt tài khoản</DialogTitle>
            <DialogDescription>
              Phê duyệt tài khoản cho {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTHOR">Tác giả</SelectItem>
                  <SelectItem value="REVIEWER">Phản biện</SelectItem>
                  <SelectItem value="SECTION_EDITOR">Biên tập viên</SelectItem>
                  <SelectItem value="MANAGING_EDITOR">Biên tập điều hành</SelectItem>
                  <SelectItem value="LAYOUT_EDITOR">Biên tập trình bày</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối tài khoản</DialogTitle>
            <DialogDescription>
              Từ chối tài khoản cho {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do từ chối</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveDialog} onOpenChange={setBulkApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phê duyệt hàng loạt</DialogTitle>
            <DialogDescription>
              Phê duyệt {selectedUsers.size} tài khoản đã chọn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-role">Vai trò</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="bulk-role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTHOR">Tác giả</SelectItem>
                  <SelectItem value="REVIEWER">Phản biện</SelectItem>
                  <SelectItem value="SECTION_EDITOR">Biên tập viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleBulkApprove} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Phê duyệt hàng loạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialog} onOpenChange={setBulkRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối hàng loạt</DialogTitle>
            <DialogDescription>
              Từ chối {selectedUsers.size} tài khoản đã chọn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Lý do từ chối</Label>
              <Textarea
                id="bulk-reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleBulkReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Từ chối hàng loạt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
