
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserEditForm } from '@/components/dashboard/user-edit-form'
import { AdminPasswordResetDialog } from '@/components/dashboard/admin-password-reset-dialog'
import { 
  User, 
  Mail, 
  Building, 
  Phone, 
  Calendar, 
  FileText, 
  MessageSquare,
  Shield,
  ArrowLeft,
  Activity,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()
  
  if (!session || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
    redirect('/dashboard')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          submissions: true,
          reviews: true,
          editorDecisions: true,
        }
      },
      submissions: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          category: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      },
      reviews: {
        select: {
          id: true,
          roundNo: true,
          recommendation: true,
          submittedAt: true,
          submission: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 10
      },
      editorDecisions: {
        select: {
          id: true,
          decision: true,
          decidedAt: true,
          submission: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          decidedAt: 'desc'
        },
        take: 10
      }
    }
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold text-muted-foreground">
              Không tìm thấy người dùng
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/admin/users">Quay lại</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
      icon: <Shield className="h-4 w-4" />
    },
    'MANAGING_EDITOR': { 
      label: 'Thư ký tòa soạn', 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <Shield className="h-4 w-4" />
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
    }
  }

  const roleInfo = roleMap[user.role] || roleMap['READER']

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
      {/* Back Button and Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
        {(session.role === 'SYSADMIN' || session.role === 'EIC') && session.uid !== user.id && (
          <AdminPasswordResetDialog 
            userId={user.id}
            userName={user.fullName}
            userEmail={user.email}
          />
        )}
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-2xl font-bold">{user._count.reviews}</div>
                <div className="text-sm text-white/80">Được phân công</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="submissions">Bài nộp</TabsTrigger>
          <TabsTrigger value="reviews">Phản biện</TabsTrigger>
          <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <CardTitle>Thông tin chi tiết</CardTitle>
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

              {user.bio && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="font-medium">Giới thiệu</span>
                  </div>
                  <p className="text-base">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
              <CardTitle>Bài nộp ({user._count.submissions})</CardTitle>
              <CardDescription>Lịch sử các bài báo đã nộp</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {user.submissions.length > 0 ? (
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
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <Badge className={status.color}>{status.label}</Badge>
                            {submission.category && (
                              <Badge variant="outline">{submission.category.name}</Badge>
                            )}
                            <span>
                              {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có bài nộp nào
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <CardTitle>Phản biện ({user._count.reviews})</CardTitle>
              <CardDescription>Lịch sử phản biện bài báo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {user.reviews.length > 0 ? (
                <div className="space-y-3">
                  {user.reviews.map((review) => (
                    <div 
                      key={review.id}
                      className="flex items-start justify-between p-4 border-2 rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold line-clamp-1 mb-2">{review.submission.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <Badge variant="outline">Vòng {review.roundNo}</Badge>
                          {review.recommendation && (
                            <Badge className="bg-purple-100 text-purple-700">{review.recommendation}</Badge>
                          )}
                          <span>
                            {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('vi-VN') : 'Chưa nộp'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có phản biện nào
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
              <CardTitle>Chỉnh sửa thông tin</CardTitle>
              <CardDescription>Cập nhật thông tin người dùng</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <UserEditForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
