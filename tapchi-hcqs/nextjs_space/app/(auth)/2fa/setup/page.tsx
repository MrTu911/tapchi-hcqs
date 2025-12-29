'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shield, Mail, Smartphone, Key, Copy, CheckCircle2, Loader2 } from 'lucide-react';

export default function Setup2FAPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState<any>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'EMAIL_OTP' | 'AUTHENTICATOR_APP'>('EMAIL_OTP');

  useEffect(() => {
    if (!session) return;
    fetchTwoFAStatus();
  }, [session]);

  const fetchTwoFAStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa');
      const data = await res.json();
      setTwoFAStatus(data);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

  const handleEnableTwoFA = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', method: selectedMethod })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Xác thực hai lớp đã được kích hoạt!');
        setBackupCodes(data.backupCodes || []);
        await fetchTwoFAStatus();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể kích hoạt 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFA = async () => {
    if (!confirm('Bạn có chắc muốn tắt xác thực hai lớp?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Xác thực hai lớp đã được tắt');
        setBackupCodes([]);
        await fetchTwoFAStatus();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể tắt 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success('Đã sao chép mã dự phòng');
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-emerald-600" />
          Xác thực hai lớp (2FA)
        </h1>
        <p className="text-muted-foreground mt-2">
          Tăng cường bảo mật cho tài khoản của bạn với xác thực hai lớp
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trạng thái 2FA</CardTitle>
              <CardDescription>
                {twoFAStatus?.enabled
                  ? 'Tài khoản của bạn đã được bảo vệ với 2FA'
                  : 'Xác thực hai lớp chưa được kích hoạt'}
              </CardDescription>
            </div>
            <Badge
              variant={twoFAStatus?.enabled ? 'default' : 'secondary'}
              className={twoFAStatus?.enabled ? 'bg-emerald-600' : ''}
            >
              {twoFAStatus?.enabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Method Selection */}
      {!twoFAStatus?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Chọn phương thức xác thực</CardTitle>
            <CardDescription>
              Chọn cách bạn muốn nhận mã xác thực
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email OTP Method */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedMethod === 'EMAIL_OTP'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
              onClick={() => setSelectedMethod('EMAIL_OTP')}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Email OTP</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nhận mã xác thực qua email của bạn. Phương thức đơn giản và tiện lợi.
                  </p>
                </div>
                {selectedMethod === 'EMAIL_OTP' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Authenticator App Method */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedMethod === 'AUTHENTICATOR_APP'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
              onClick={() => setSelectedMethod('AUTHENTICATOR_APP')}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Ứng dụng xác thực</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sử dụng Google Authenticator hoặc các ứng dụng tương tự. Bảo mật cao hơn.
                  </p>
                </div>
                {selectedMethod === 'AUTHENTICATOR_APP' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleEnableTwoFA}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kích hoạt...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Kích hoạt xác thực hai lớp
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes Display */}
      {backupCodes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-600 mt-1" />
              <div>
                <CardTitle className="text-amber-900">Mã dự phòng</CardTitle>
                <CardDescription className="text-amber-700">
                  ⚠️ Lưu các mã này ở nơi an toàn! Bạn sẽ cần chúng nếu mất quyền truy cập vào phương
                  thức xác thực chính.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span className="font-semibold">{code}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCopyBackupCodes}
              className="w-full"
            >
              {copiedCodes ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Sao chép tất cả mã
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disable 2FA */}
      {twoFAStatus?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Tắt xác thực hai lớp</CardTitle>
            <CardDescription>
              Tài khoản của bạn sẽ ít an toàn hơn nếu tắt 2FA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDisableTwoFA}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Tắt xác thực hai lớp'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
