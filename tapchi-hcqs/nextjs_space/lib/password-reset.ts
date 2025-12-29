
/**
 * ✅ Phase 2: Password Reset Service
 * Quản lý password reset tokens và email
 */

import { prisma } from './prisma'
import crypto from 'crypto'
import { sendEmail } from './email'
import bcrypt from 'bcryptjs'

/**
 * Tạo secure reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Tạo password reset token và gửi email
 */
export async function createPasswordResetToken(email: string): Promise<{ success: boolean; message: string }> {
  // Tìm user
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    // Không tiết lộ email có tồn tại hay không (security)
    return {
      success: true,
      message: 'Nếu email tồn tại, link reset password đã được gửi.'
    }
  }
  
  if (!user.isActive) {
    return {
      success: false,
      message: 'Tài khoản đã bị vô hiệu hóa.'
    }
  }
  
  // Xóa các token cũ chưa sử dụng
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      used: false
    }
  })
  
  // Tạo token mới (valid 1 giờ)
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 giờ
  
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  })
  
  // Gửi email
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
  
  await sendPasswordResetEmail(user.email, user.fullName, resetLink)
  
  return {
    success: true,
    message: 'Link reset password đã được gửi đến email của bạn.'
  }
}

/**
 * Gửi email reset password
 */
async function sendPasswordResetEmail(email: string, userName: string, resetLink: string) {
  const subject = '🔑 Yêu cầu đặt lại mật khẩu - Tạp chí HCQS'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Đặt lại mật khẩu</h2>
      <p>Xin chào <strong>${userName}</strong>,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p>Hoặc copy link sau vào trình duyệt:</p>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 12px;">
        ${resetLink}
      </div>
      <p style="margin-top: 20px;">Link này có hiệu lực trong <strong>1 giờ</strong>.</p>
      <p style="color: #dc2626;">⚠️ Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ với quản trị viên.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  `
  
  await sendEmail({
    to: email,
    subject,
    html,
    text: `Đặt lại mật khẩu tại: ${resetLink}. Link có hiệu lực trong 1 giờ.`
  })
}

/**
 * Verify reset token
 */
export async function verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string; message?: string }> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  })
  
  if (!resetToken) {
    return { valid: false, message: 'Token không hợp lệ.' }
  }
  
  if (resetToken.used) {
    return { valid: false, message: 'Token đã được sử dụng.' }
  }
  
  if (resetToken.expiresAt < new Date()) {
    return { valid: false, message: 'Token đã hết hạn.' }
  }
  
  // Check if user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: resetToken.userId }
  })
  
  if (!user) {
    return { valid: false, message: 'User không tồn tại.' }
  }
  
  if (!user.isActive) {
    return { valid: false, message: 'Tài khoản đã bị vô hiệu hóa.' }
  }
  
  return { valid: true, userId: resetToken.userId }
}

/**
 * Reset password
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // Verify token
  const verification = await verifyResetToken(token)
  if (!verification.valid || !verification.userId) {
    return {
      success: false,
      message: verification.message || 'Token không hợp lệ.'
    }
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  // Update password
  await prisma.user.update({
    where: { id: verification.userId },
    data: { passwordHash }
  })
  
  // Mark token as used
  await prisma.passwordResetToken.updateMany({
    where: { token },
    data: { used: true }
  })
  
  // Invalidate all user sessions (force re-login)
  await prisma.userSession.deleteMany({
    where: { userId: verification.userId }
  })
  
  return {
    success: true,
    message: 'Mật khẩu đã được đặt lại thành công.'
  }
}
