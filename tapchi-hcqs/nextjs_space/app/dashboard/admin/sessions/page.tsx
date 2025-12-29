
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Monitor, Clock, MapPin, LogOut, RefreshCw, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface Session {
  id: string
  userId: string
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
  loginTime: string
  ip: string | null
  duration: number
}

export default function SessionsManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/sessions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.sessions)
    } catch (error: any) {
      toast.error('Lỗi tải phiên đăng nhập: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleTerminateSession = async () => {
    if (!selectedSession) return

    try {
      setTerminatingSession(selectedSession.userId)
      
      const response = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: selectedSession.userId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terminate session failed')
      }

      toast.success('Đã kết thúc phiên đăng nhập')
      fetchSessions()
      setShowTerminateDialog(false)
      setSelectedSession(null)
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
    } finally {
      setTerminatingSession(null)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'READER': 'Độc giả',
      'AUTHOR': 'Tác giả',
      'REVIEWER': 'Phản biện',
      'SECTION_EDITOR': 'Biên tập viên',
      'MANAGING_EDITOR': 'Thư ký tòa soạn',
      'EIC': 'Tổng biên tập',
      'LAYOUT_EDITOR': 'Biên tập bố cục',
      'SYSADMIN': 'Quản trị viên',
      'SECURITY_AUDITOR': 'Kiểm định bảo mật'
    }
    return roleMap[role] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, any> = {
      'SYSADMIN': 'destructive',
      'EIC': 'default',
      'MANAGING_EDITOR': 'secondary',
      'SECTION_EDITOR': 'secondary',
      'REVIEWER': 'outline',
      'AUTHOR': 'outline',
      'READER': 'outline'
    }
    return variantMap[role] || 'default'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours} giờ ${mins} phút`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý phiên đăng nhập</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và quản lý các phiên đăng nhập đang hoạt động
          </p>
        </div>
        <Button onClick={fetchSessions} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng phiên</p>
                <p className="text-3xl font-bold mt-2">{sessions.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phiên admin</p>
                <p className="text-3xl font-bold mt-2">
                  {sessions.filter(s => ['SYSADMIN', 'EIC'].includes(s.user.role)).length}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thời gian trung bình</p>
                <p className="text-3xl font-bold mt-2">
                  {sessions.length > 0 
                    ? Math.floor(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)
                    : 0}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Phiên đăng nhập đang hoạt động</CardTitle>
          <CardDescription>
            Danh sách các phiên đăng nhập hiện tại (cập nhật tự động mỗi 30 giây)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có phiên đăng nhập nào đang hoạt động
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                        {getInitials(session.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">{session.user.fullName}</h4>
                        <Badge variant={getRoleBadgeVariant(session.user.role)}>
                          {getRoleLabel(session.user.role)}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Activity className="mr-1 h-3 w-3" />
                          Hoạt động
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{session.user.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Đăng nhập: {new Date(session.loginTime).toLocaleString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          Thời gian: {formatDuration(session.duration)}
                        </span>
                        {session.ip && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            IP: {session.ip}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setSelectedSession(session)
                      setShowTerminateDialog(true)
                    }}
                    disabled={terminatingSession === session.userId}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Kết thúc
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminate Confirmation Dialog */}
      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận kết thúc phiên đăng nhập</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kết thúc phiên đăng nhập của người dùng <strong>{selectedSession?.user.fullName}</strong>?
              Người dùng sẽ bị đăng xuất khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!terminatingSession}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTerminateSession}
              disabled={!!terminatingSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {terminatingSession ? 'Đang xử lý...' : 'Xác nhận'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
