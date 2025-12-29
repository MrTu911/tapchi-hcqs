
'use client'

/**
 * ✅ Phase 2: Two-Factor Authentication Setup Dialog
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Mail, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TwoFactorDialog({ open, onOpenChange, onSuccess }: TwoFactorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [method, setMethod] = useState<string | null>(null)
  const [step, setStep] = useState<'status' | 'verify' | 'backup'>('status')
  const [otp, setOtp] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Load 2FA status
  useEffect(() => {
    if (open) {
      fetchStatus()
    }
  }, [open])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa')
      const data = await res.json()
      setEnabled(data.enabled)
      setMethod(data.method)
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  const handleEnable = async () => {
    setLoading(true)
    try {
      // Send OTP
      const sendRes = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST'
      })

      if (!sendRes.ok) {
        throw new Error('Failed to send OTP')
      }

      toast.success('Mã OTP đã được gửi đến email của bạn')
      setStep('verify')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập mã OTP 6 chữ số')
      return
    }

    setLoading(true)
    try {
      // Verify OTP
      const verifyRes = await fetch('/api/auth/2fa/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.valid) {
        toast.error(verifyData.error || 'OTP không hợp lệ')
        return
      }

      // Enable 2FA
      const enableRes = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', method: 'EMAIL_OTP' })
      })

      const enableData = await enableRes.json()

      if (!enableRes.ok) {
        throw new Error(enableData.error)
      }

      setBackupCodes(enableData.backupCodes)
      setEnabled(true)
      setStep('backup')
      toast.success('2FA đã được kích hoạt thành công')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('Bạn có chắc muốn tắt 2FA? Tài khoản sẽ kém an toàn hơn.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' })
      })

      if (!res.ok) {
        throw new Error('Failed to disable 2FA')
      }

      setEnabled(false)
      toast.success('2FA đã được tắt')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    const text = backupCodes.join('\n')
    navigator.clipboard.writeText(text)
    setCopiedCodes(true)
    toast.success('Đã copy backup codes')
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  const handleClose = () => {
    setStep('status')
    setOtp('')
    setBackupCodes([])
    setCopiedCodes(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Xác thực hai yếu tố (2FA)
          </DialogTitle>
          <DialogDescription>
            Tăng cường bảo mật tài khoản với xác thực 2 lớp
          </DialogDescription>
        </DialogHeader>

        {step === 'status' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Trạng thái 2FA</p>
                <p className="text-sm text-muted-foreground">
                  {enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                </p>
              </div>
              <Badge variant={enabled ? 'default' : 'secondary'}>
                {enabled ? 'Bật' : 'Tắt'}
              </Badge>
            </div>

            {enabled && method && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Phương thức:</strong> {method === 'EMAIL_OTP' ? 'Email OTP' : method}
                </p>
              </div>
            )}

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Khi bật 2FA, bạn sẽ nhận mã xác thực qua email mỗi khi đăng nhập.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Mã OTP 6 chữ số đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập bên dưới.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Mã có hiệu lực trong 10 phút
              </p>
            </div>
          </div>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Quan trọng:</strong> Lưu các mã backup này ở nơi an toàn. 
                Bạn có thể sử dụng chúng để đăng nhập khi không có OTP.
              </AlertDescription>
            </Alert>

            <div className="relative p-4 bg-muted rounded-lg font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="text-center">{code}</div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyBackupCodes}
              >
                {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'status' && !enabled && (
            <Button onClick={handleEnable} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kích hoạt 2FA
            </Button>
          )}

          {step === 'status' && enabled && (
            <Button onClick={handleDisable} variant="destructive" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tắt 2FA
            </Button>
          )}

          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={() => setStep('status')}>
                Hủy
              </Button>
              <Button onClick={handleVerify} disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </>
          )}

          {step === 'backup' && (
            <Button onClick={handleClose}>
              Hoàn tất
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
