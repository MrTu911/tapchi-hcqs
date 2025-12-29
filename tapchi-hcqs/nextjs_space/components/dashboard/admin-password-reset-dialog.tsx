
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { KeyRound, Copy, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'

interface AdminPasswordResetDialogProps {
  userId: string
  userName: string
  userEmail: string
}

export function AdminPasswordResetDialog({ userId, userName, userEmail }: AdminPasswordResetDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleResetPassword = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Reset mật khẩu thất bại')
      }

      setNewPassword(data.data.newPassword)
      toast.success('Reset mật khẩu thành công!')
      setShowConfirm(false)
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      toast.success('Đã sao chép mật khẩu')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => {
      setNewPassword(null)
      setCopied(false)
    }, 300)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <KeyRound className="mr-2 h-4 w-4" />
            Reset mật khẩu
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset mật khẩu người dùng
            </DialogTitle>
            <DialogDescription>
              Reset mật khẩu cho người dùng: <span className="font-semibold">{userName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!newPassword ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cảnh báo</AlertTitle>
                <AlertDescription>
                  Hành động này sẽ tạo mật khẩu mới ngẫu nhiên và ghi đè mật khẩu hiện tại của người dùng.
                  Người dùng sẽ không thể đăng nhập bằng mật khẩu cũ.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-200">Thành công</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Mật khẩu mới đã được tạo. Vui lòng sao chép và gửi cho người dùng.
                  </AlertDescription>
                </Alert>

                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email người dùng</label>
                        <p className="text-base font-semibold">{userEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mật khẩu mới</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm border">
                            {newPassword}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopyPassword}
                            className="shrink-0"
                          >
                            {copied ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Quan trọng</AlertTitle>
                  <AlertDescription>
                    Đây là lần duy nhất bạn có thể xem mật khẩu này. Vui lòng sao chép và gửi cho người dùng ngay.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <DialogFooter>
            {!newPassword ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={loading}
                  variant="destructive"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận reset
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full">
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ reset mật khẩu của người dùng <strong>{userName}</strong>.
              Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
