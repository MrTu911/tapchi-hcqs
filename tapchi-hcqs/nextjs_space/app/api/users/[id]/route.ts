
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger'

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  org: z.string().optional(),
  bio: z.string().optional(),
  rank: z.string().optional(),
  position: z.string().optional(),
  academicTitle: z.string().optional(),
  academicDegree: z.string().optional(),
  role: z.enum([
    'READER',
    'AUTHOR',
    'REVIEWER',
    'SECTION_EDITOR',
    'MANAGING_EDITOR',
    'EIC',
    'LAYOUT_EDITOR',
    'SYSADMIN',
    'SECURITY_AUDITOR'
  ]).optional(),
  isActive: z.boolean().optional(),
  expertise: z.array(z.string()).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { expertise, password, ...validatedData } = updateUserSchema.parse(body)

    // Handle password update separately if provided
    const updateData: any = { ...validatedData }
    if (password) {
      const { hashPassword } = await import('@/lib/auth')
      updateData.passwordHash = await hashPassword(password)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        org: true,
        bio: true,
        role: true,
        rank: true,
        position: true,
        academicTitle: true,
        academicDegree: true,
        isActive: true
      }
    })

    // Update reviewer profile if expertise is provided and user is a reviewer
    if (expertise && user.role === 'REVIEWER') {
      const existingProfile = await prisma.reviewerProfile.findUnique({
        where: { userId: params.id }
      })

      if (existingProfile) {
        await prisma.reviewerProfile.update({
          where: { userId: params.id },
          data: { expertise }
        })
      } else {
        await prisma.reviewerProfile.create({
          data: {
            userId: params.id,
            expertise,
            keywords: []
          }
        })
      }
    }

    await logAudit({
      action: 'UPDATE_USER',
      actorId: session.uid,
      object: params.id,
      after: { 
        updatedBy: session.email,
        updatedFields: Object.keys(validatedData) 
      }
    })

    return NextResponse.json({
      success: true,
      user: user,
      message: 'Cập nhật người dùng thành công'
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Don't allow deleting yourself
    if (params.id === session.uid) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản của chính bạn' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    await logAudit({
      action: 'DELETE_USER',
      actorId: session.uid,
      object: params.id,
      after: { deletedBy: session.email }
    })

    return NextResponse.json({
      success: true,
      message: 'Xóa người dùng thành công'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
