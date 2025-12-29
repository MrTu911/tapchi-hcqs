

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Users, Search, Plus, Edit, Trash2, Loader2, Mail, Building2, Award, GraduationCap, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

interface Reviewer {
  id: string
  fullName: string
  email: string
  org?: string
  rank?: string
  position?: string
  academicTitle?: string
  academicDegree?: string
  expertise?: string[]
  pendingReviews?: number
  completedReviews?: number
}

export default function ReviewersManagementPage() {
  const [loading, setLoading] = useState(true)
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    org: '',
    rank: '',
    position: '',
    academicTitle: 'none',
    academicDegree: 'none',
    expertise: ''
  })

  useEffect(() => {
    loadReviewers()
  }, [])

  const loadReviewers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users?role=REVIEWER')
      const data = await response.json()
      
      if (data.users) {
        // Map the data to flatten reviewerProfile
        const mappedReviewers = data.users.map((user: any) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          org: user.org,
          rank: user.rank,
          position: user.position,
          academicTitle: user.academicTitle,
          academicDegree: user.academicDegree,
          expertise: user.reviewerProfile?.expertise || [],
          pendingReviews: user._count?.reviews || 0,
          completedReviews: user.reviewerProfile?.completedReviews || 0
        }))
        setReviewers(mappedReviewers)
      }
    } catch (error) {
      console.error('Failed to load reviewers:', error)
      toast.error('Không thể tải danh sách phản biện viên')
    } finally {
      setLoading(false)
    }
  }

  const handleAddReviewer = async () => {
    try {
      if (!formData.fullName || !formData.email || !formData.password) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          academicTitle: formData.academicTitle === 'none' ? null : formData.academicTitle,
          academicDegree: formData.academicDegree === 'none' ? null : formData.academicDegree,
          role: 'REVIEWER',
          expertise: formData.expertise ? formData.expertise.split(',').map(e => e.trim()) : []
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Thêm phản biện viên thành công')
        setIsAddDialogOpen(false)
        resetForm()
        loadReviewers()
      } else {
        toast.error(data.message || 'Không thể thêm phản biện viên')
      }
    } catch (error) {
      console.error('Failed to add reviewer:', error)
      toast.error('Đã xảy ra lỗi khi thêm phản biện viên')
    }
  }

  const handleEditReviewer = async () => {
    try {
      if (!selectedReviewer || !formData.fullName || !formData.email) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      const updateData: any = {
        fullName: formData.fullName,
        email: formData.email,
        org: formData.org,
        rank: formData.rank,
        position: formData.position,
        academicTitle: formData.academicTitle === 'none' ? null : formData.academicTitle,
        academicDegree: formData.academicDegree === 'none' ? null : formData.academicDegree,
        expertise: formData.expertise ? formData.expertise.split(',').map(e => e.trim()) : []
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${selectedReviewer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Cập nhật phản biện viên thành công')
        setIsEditDialogOpen(false)
        setSelectedReviewer(null)
        resetForm()
        loadReviewers()
      } else {
        toast.error(data.message || 'Không thể cập nhật phản biện viên')
      }
    } catch (error) {
      console.error('Failed to update reviewer:', error)
      toast.error('Đã xảy ra lỗi khi cập nhật phản biện viên')
    }
  }

  const handleDeleteReviewer = async () => {
    try {
      if (!selectedReviewer) return

      const response = await fetch(`/api/users/${selectedReviewer.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Xóa phản biện viên thành công')
        setIsDeleteDialogOpen(false)
        setSelectedReviewer(null)
        loadReviewers()
      } else {
        toast.error(data.message || 'Không thể xóa phản biện viên')
      }
    } catch (error) {
      console.error('Failed to delete reviewer:', error)
      toast.error('Đã xảy ra lỗi khi xóa phản biện viên')
    }
  }

  const openEditDialog = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer)
    setFormData({
      fullName: reviewer.fullName,
      email: reviewer.email,
      password: '',
      org: reviewer.org || '',
      rank: reviewer.rank || '',
      position: reviewer.position || '',
      academicTitle: reviewer.academicTitle || 'none',
      academicDegree: reviewer.academicDegree || 'none',
      expertise: reviewer.expertise?.join(', ') || ''
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (reviewer: Reviewer) => {
    setSelectedReviewer(reviewer)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      org: '',
      rank: '',
      position: '',
      academicTitle: 'none',
      academicDegree: 'none',
      expertise: ''
    })
  }

  const filteredReviewers = reviewers.filter(r =>
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.org?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Quản lý Phản biện viên
          </h1>
          <p className="text-muted-foreground mt-1">
            Tìm kiếm, thêm, sửa, xóa phản biện viên
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm phản biện viên
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm phản biện viên mới</DialogTitle>
              <DialogDescription>
                Điền đầy đủ thông tin của phản biện viên mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rank">Cấp bậc</Label>
                  <Input
                    id="rank"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="Thiếu tá, Trung tá..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Chức vụ</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Trưởng khoa, Phó trưởng bộ môn..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicTitle">Học hàm</Label>
                  <Select
                    value={formData.academicTitle}
                    onValueChange={(value) => setFormData({ ...formData, academicTitle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học hàm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      <SelectItem value="giang_vien">Giảng viên</SelectItem>
                      <SelectItem value="giang_vien_chinh">Giảng viên chính</SelectItem>
                      <SelectItem value="giang_vien_cao_cap">Giảng viên cao cấp</SelectItem>
                      <SelectItem value="nghien_cuu_vien">Nghiên cứu viên</SelectItem>
                      <SelectItem value="nghien_cuu_vien_chinh">Nghiên cứu viên chính</SelectItem>
                      <SelectItem value="nghien_cuu_vien_cao_cap">Nghiên cứu viên cao cấp</SelectItem>
                      <SelectItem value="pho_giao_su">Phó giáo sư</SelectItem>
                      <SelectItem value="giao_su">Giáo sư</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicDegree">Học vị</Label>
                  <Select
                    value={formData.academicDegree}
                    onValueChange={(value) => setFormData({ ...formData, academicDegree: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học vị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      <SelectItem value="cu_nhan">Cử nhân</SelectItem>
                      <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                      <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                      <SelectItem value="tien_si_khoa_hoc">Tiến sĩ khoa học</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expertise">Lĩnh vực chuyên môn</Label>
                <Input
                  id="expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  placeholder="Hậu cần, Quân sự, Kinh tế (phân cách bằng dấu phẩy)"
                />
                <p className="text-xs text-muted-foreground">
                  Nhập các lĩnh vực chuyên môn, phân cách bằng dấu phẩy
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddReviewer}>
                Thêm phản biện viên
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên, email, đơn vị, cấp bậc, chức vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reviewers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phản biện viên ({filteredReviewers.length})</CardTitle>
          <CardDescription>
            Quản lý thông tin các phản biện viên trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : filteredReviewers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Không tìm thấy phản biện viên nào' : 'Chưa có phản biện viên nào'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Học hàm</TableHead>
                    <TableHead>Học vị</TableHead>
                    <TableHead>Lĩnh vực</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviewers.map((reviewer) => (
                    <TableRow key={reviewer.id}>
                      <TableCell className="font-medium">{reviewer.fullName}</TableCell>
                      <TableCell>{reviewer.email}</TableCell>
                      <TableCell>{reviewer.org || '-'}</TableCell>
                      <TableCell>{reviewer.rank || '-'}</TableCell>
                      <TableCell>{reviewer.position || '-'}</TableCell>
                      <TableCell>{reviewer.academicTitle || '-'}</TableCell>
                      <TableCell>{reviewer.academicDegree || '-'}</TableCell>
                      <TableCell>
                        {reviewer.expertise && reviewer.expertise.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {reviewer.expertise.slice(0, 2).map((exp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {exp}
                              </Badge>
                            ))}
                            {reviewer.expertise.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{reviewer.expertise.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(reviewer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(reviewer)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin phản biện viên</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho: {selectedReviewer?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-password">Mật khẩu mới (để trống nếu không đổi)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-org">Đơn vị công tác</Label>
              <Input
                id="edit-org"
                value={formData.org}
                onChange={(e) => setFormData({ ...formData, org: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-rank">Cấp bậc</Label>
                <Input
                  id="edit-rank"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Chức vụ</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-academicTitle">Học hàm</Label>
                <Select
                  value={formData.academicTitle}
                  onValueChange={(value) => setFormData({ ...formData, academicTitle: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn học hàm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    <SelectItem value="giang_vien">Giảng viên</SelectItem>
                    <SelectItem value="giang_vien_chinh">Giảng viên chính</SelectItem>
                    <SelectItem value="giang_vien_cao_cap">Giảng viên cao cấp</SelectItem>
                    <SelectItem value="nghien_cuu_vien">Nghiên cứu viên</SelectItem>
                    <SelectItem value="nghien_cuu_vien_chinh">Nghiên cứu viên chính</SelectItem>
                    <SelectItem value="nghien_cuu_vien_cao_cap">Nghiên cứu viên cao cấp</SelectItem>
                    <SelectItem value="pho_giao_su">Phó giáo sư</SelectItem>
                    <SelectItem value="giao_su">Giáo sư</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-academicDegree">Học vị</Label>
                <Select
                  value={formData.academicDegree}
                  onValueChange={(value) => setFormData({ ...formData, academicDegree: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn học vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không có</SelectItem>
                    <SelectItem value="cu_nhan">Cử nhân</SelectItem>
                    <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                    <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                    <SelectItem value="tien_si_khoa_hoc">Tiến sĩ khoa học</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expertise">Lĩnh vực chuyên môn</Label>
              <Input
                id="edit-expertise"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                placeholder="Hậu cần, Quân sự, Kinh tế (phân cách bằng dấu phẩy)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditReviewer}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phản biện viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phản biện viên <strong>{selectedReviewer?.fullName}</strong>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedReviewer(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReviewer}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
