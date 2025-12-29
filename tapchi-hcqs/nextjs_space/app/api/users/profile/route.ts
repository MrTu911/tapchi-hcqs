
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger'

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
  org: z.string().optional(),
  bio: z.string().optional()
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.uid },
      data: validatedData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        org: true,
        bio: true
      }
    })

    await logAudit({
      action: 'UPDATE_PROFILE',
      actorId: session.uid,
      object: "user_profile",
      after: { updatedFields: Object.keys(validatedData) }
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
