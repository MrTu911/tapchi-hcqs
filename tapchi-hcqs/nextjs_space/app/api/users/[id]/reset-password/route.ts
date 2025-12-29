
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit-logger'

// Generate random password
function generatePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    // Only SYSADMIN and EIC can reset passwords
    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền reset mật khẩu' },
        { status: 403 }
      )
    }

    // Cannot reset own password through this endpoint
    if (params.id === session.uid) {
      return NextResponse.json(
        { error: 'Không thể reset mật khẩu của chính bạn. Vui lòng sử dụng chức năng đổi mật khẩu.' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Generate new password
    const newPassword = generatePassword(12)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: params.id },
      data: { 
        passwordHash: hashedPassword
      }
    })

    // Log the action
    await logAudit({
      action: 'ADMIN_RESET_PASSWORD',
      actorId: session.uid,
      object: params.id,
      after: {
        resetBy: session.email,
        targetUser: user.email,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Reset mật khẩu thành công',
      data: {
        userId: user.id,
        email: user.email,
        newPassword: newPassword,
        warning: 'Vui lòng lưu mật khẩu này và gửi cho người dùng. Bạn sẽ không thể xem lại mật khẩu này.'
      }
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi reset mật khẩu' },
      { status: 500 }
    )
  }
}
