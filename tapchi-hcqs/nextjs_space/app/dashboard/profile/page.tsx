
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ProfileEditForm } from '@/components/dashboard/profile-edit-form'
import { PasswordChangeForm } from '@/components/dashboard/password-change-form'
import { SecuritySettings } from '@/components/dashboard/security-settings'
import { 
  User, 
  Mail, 
  Building, 
  Phone, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Award,
  Shield,
  Clock,
  Lock
} from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: {
      _count: {
        select: {
          submissions: true,
          reviews: true,
          editorDecisions: true
        }
      },
      submissions: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      },
      reviews: {
        select: {
          id: true,
          submission: {
            select: {
              id: true,
              title: true
            }
          },
          roundNo: true,
          recommendation: true,
          submittedAt: true
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      }
    }
  })

  if (!user) {
    redirect('/auth/login')
  }

  const roleMap: Record<string, { label: string, color: string, icon: JSX.Element }> = {
    'READER': { 
      label: 'Độc giả', 
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      icon: <User className="h-4 w-4" />
    },
    'AUTHOR': { 
      label: 'Tác giả', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: <FileText className="h-4 w-4" />
    },
    'REVIEWER': { 
      label: 'Phản biện', 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: <MessageSquare className="h-4 w-4" />
    },
    'SECTION_EDITOR': { 
      label: 'Biên tập viên', 
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      icon: <Award className="h-4 w-4" />
    },
    'MANAGING_EDITOR': { 
      label: 'Thư ký tòa soạn', 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <Award className="h-4 w-4" />
    },
    'EIC': { 
      label: 'Tổng biên tập', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      icon: <Shield className="h-4 w-4" />
    },
    'LAYOUT_EDITOR': { 
      label: 'Biên tập bố cục', 
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      icon: <FileText className="h-4 w-4" />
    },
    'SYSADMIN': { 
      label: 'Quản trị viên', 
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      icon: <Shield className="h-4 w-4" />
    },
    'SECURITY_AUDITOR': { 
      label: 'Kiểm định bảo mật', 
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      icon: <Shield className="h-4 w-4" />
    }
  }

  const roleInfo = roleMap[user.role] || roleMap['READER']

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const statusMap: Record<string, { label: string, color: string }> = {
    'NEW': { label: 'Mới', color: 'bg-blue-100 text-blue-700' },
    'UNDER_REVIEW': { label: 'Đang phản biện', color: 'bg-yellow-100 text-yellow-700' },
    'ACCEPTED': { label: 'Chấp nhận', color: 'bg-green-100 text-green-700' },
    'REJECTED': { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
    'REVISION_REQUIRED': { label: 'Yêu cầu sửa', color: 'bg-orange-100 text-orange-700' },
    'PUBLISHED': { label: 'Đã xuất bản', color: 'bg-emerald-100 text-emerald-700' }
  }

  return (
    <div className="space-y-6">
      {/* Header với gradient đẹp */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white/30 shadow-xl bg-white/20 backdrop-blur-sm">
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-white/30 to-white/10 text-white">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-md">{user.fullName}</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-lg ${roleInfo.color} backdrop-blur-sm`}>
              {roleInfo.icon}
              {roleInfo.label}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-2xl font-bold">{user._count.submissions}</div>
                <div className="text-sm text-white/80">Bài nộp</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-2xl font-bold">{user._count.reviews}</div>
                <div className="text-sm text-white/80">Phản biện</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-2xl font-bold">{user._count.editorDecisions}</div>
                <div className="text-sm text-white/80">Quyết định</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Thông tin</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Mật khẩu</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Hoạt động</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Chi tiết tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Họ và tên</span>
                  </div>
                  <p className="text-lg font-semibold">{user.fullName}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                  </div>
                  <p className="text-lg font-semibold">{user.email}</p>
                </div>

                {user.phone && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Số điện thoại</span>
                    </div>
                    <p className="text-lg font-semibold">{user.phone}</p>
                  </div>
                )}

                {user.org && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">Đơn vị</span>
                    </div>
                    <p className="text-lg font-semibold">{user.org}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Ngày tham gia</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Trạng thái</span>
                  </div>
                  <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-base px-3 py-1">
                    {user.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardTitle>Chỉnh sửa thông tin</CardTitle>
              <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileEditForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu để bảo mật tài khoản</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PasswordChangeForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Recent Submissions */}
          {user.submissions.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <CardTitle>Bài nộp gần đây</CardTitle>
                <CardDescription>Các bài báo bạn đã nộp</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {user.submissions.map((submission) => {
                    const status = statusMap[submission.status] || { label: submission.status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <div 
                        key={submission.id}
                        className="flex items-start justify-between p-4 border-2 rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold line-clamp-1 mb-2">{submission.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Badge className={status.color}>{status.label}</Badge>
                            <span>
                              {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/dashboard/author/submissions/${submission.id}`}>
                            Xem
                          </a>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          {user.reviews.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <CardTitle>Phản biện gần đây</CardTitle>
                <CardDescription>Các bài bạn đã phản biện</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {user.reviews.map((review) => (
                    <div 
                      key={review.id}
                      className="flex items-start justify-between p-4 border-2 rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold line-clamp-1 mb-2">{review.submission.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Badge variant="outline">{review.recommendation || 'Chưa nộp'}</Badge>
                          <span>
                            {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'Chưa nộp'}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/reviewer/reviews/${review.id}`}>
                          Xem
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
