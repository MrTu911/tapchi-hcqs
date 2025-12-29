'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function Verify2FAPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    // Auto-send OTP when component mounts
    if (session && countdown === 0) {
      handleSendOTP();
    }
  }, [session]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    setSendingOTP(true);
    try {
      const res = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST'
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Mã OTP đã được gửi đến email của bạn');
        setCountdown(60); // 60 seconds cooldown
      } else {
        toast.error(data.error || 'Không thể gửi OTP');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^[0-9]{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 số');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        toast.success('Xác thực thành công!');
        setTimeout(() => {
          router.push(callbackUrl);
        }, 500);
      } else {
        toast.error(data.error || 'Mã OTP không hợp lệ');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xác thực');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Xác thực hai lớp</CardTitle>
          <CardDescription>
            Nhập mã OTP 6 số đã được gửi đến email của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {inputRefs.current[index] = el;}}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={loading}
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerifyOTP()}
            disabled={loading || otp.some((d) => d === '')}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Xác thực
              </>
            )}
          </Button>

          {/* Resend OTP */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Không nhận được mã?</p>
            <Button
              variant="outline"
              onClick={handleSendOTP}
              disabled={sendingOTP || countdown > 0}
              size="sm"
            >
              {sendingOTP ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Đang gửi...
                </>
              ) : countdown > 0 ? (
                `Gửi lại sau ${countdown}s`
              ) : (
                <>
                  <Mail className="mr-2 h-3 w-3" />
                  Gửi lại mã
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Mẹo:</strong> Bạn có thể dán trực tiếp mã 6 số từ email vào ô đầu tiên.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
