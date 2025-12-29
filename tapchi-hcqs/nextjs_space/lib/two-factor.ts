
/**
 * ✅ Phase 2: Two-Factor Authentication Service
 * Hỗ trợ Email OTP và TOTP (Google Authenticator)
 */

import { prisma } from './prisma'
import crypto from 'crypto'
import { sendEmail } from './email'

export enum TwoFactorMethod {
  EMAIL_OTP = 'EMAIL_OTP',
  TOTP = 'TOTP',
  SMS = 'SMS'
}

/**
 * Tạo OTP code 6 chữ số
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Tạo backup codes (10 codes, mỗi code 8 ký tự)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
  }
  return codes
}

/**
 * Hash backup code để lưu trữ an toàn
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  return hashBackupCode(code) === hashedCode
}

/**
 * Gửi OTP qua email
 */
export async function sendOTPEmail(email: string, otp: string, userName: string) {
  const subject = '🔐 Mã xác thực đăng nhập - Tạp chí HCQS'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Mã xác thực đăng nhập</h2>
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Mã OTP của bạn là:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #059669; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
      </div>
      <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
      <p style="color: #dc2626;">⚠️ Không chia sẻ mã này với bất kỳ ai!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
      </p>
    </div>
  `
  
  await sendEmail({
    to: email,
    subject,
    html,
    text: `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 10 phút.`
  })
}

/**
 * Tạo và lưu OTP token
 */
export async function createOTPToken(userId: string): Promise<string> {
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 phút
  
  // Xóa các token cũ chưa sử dụng
  await prisma.twoFactorToken.deleteMany({
    where: {
      userId,
      used: false,
      expiresAt: { lt: new Date() }
    }
  })
  
  // Tạo token mới
  await prisma.twoFactorToken.create({
    data: {
      userId,
      token: otp,
      expiresAt
    }
  })
  
  return otp
}

/**
 * Verify OTP token
 */
export async function verifyOTPToken(userId: string, otp: string): Promise<boolean> {
  const token = await prisma.twoFactorToken.findFirst({
    where: {
      userId,
      token: otp,
      used: false,
      expiresAt: { gte: new Date() }
    }
  })
  
  if (!token) {
    return false
  }
  
  // Đánh dấu token đã sử dụng
  await prisma.twoFactorToken.update({
    where: { id: token.id },
    data: { used: true }
  })
  
  return true
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: string, method: TwoFactorMethod) {
  // Check if 2FA already exists
  const existing = await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
  
  const backupCodes = generateBackupCodes()
  const hashedBackupCodes = backupCodes.map(hashBackupCode)
  
  if (existing) {
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        method,
        isEnabled: true,
        backupCodes: hashedBackupCodes
      }
    })
  } else {
    await prisma.twoFactorAuth.create({
      data: {
        userId,
        method,
        isEnabled: true,
        backupCodes: hashedBackupCodes
      }
    })
  }
  
  return backupCodes // Return unhashed codes to show user once
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string) {
  await prisma.twoFactorAuth.updateMany({
    where: { userId },
    data: { isEnabled: false }
  })
}

/**
 * Check if user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
  
  return twoFactor?.isEnabled ?? false
}

/**
 * Get 2FA config for user
 */
export async function get2FAConfig(userId: string) {
  return await prisma.twoFactorAuth.findUnique({
    where: { userId }
  })
}
