
'use client'

/**
 * ✅ Phase 2: Security Settings Client Component
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Key } from 'lucide-react'
import { TwoFactorDialog } from './two-factor-dialog'

export function SecuritySettings() {
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Xác thực hai yếu tố (2FA)
          </CardTitle>
          <CardDescription>
            Tăng cường bảo mật tài khoản bằng xác thực 2 lớp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Khi bật 2FA, bạn sẽ cần nhập mã xác thực từ email mỗi khi đăng nhập từ thiết bị mới.
          </p>
          <Button onClick={() => setTwoFactorOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Quản lý 2FA
          </Button>
        </CardContent>
      </Card>

      <TwoFactorDialog
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
      />
    </div>
  )
}
