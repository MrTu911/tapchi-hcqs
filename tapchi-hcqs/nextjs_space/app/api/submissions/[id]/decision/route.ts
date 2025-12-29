export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

interface RouteContext {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession()
    
    if (!session || !can.decide(session.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền đưa ra quyết định' },
        { status: 403 }
      )
    }

    const { id } = context.params
    const body = await request.json()
    const { decision, note, roundNo } = body

    if (!decision || !roundNo) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviews: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }

    // Create editor decision
    const editorDecision = await prisma.editorDecision.create({
      data: {
        submissionId: id,
        roundNo,
        decision: decision as any,
        note: note || null,
        decidedBy: session.uid
      }
    })

    // ✅ Enforce State Machine cho submission status
    let newStatus = submission.status
    switch (decision) {
      case 'ACCEPT':
        // ACCEPT → chuyển sang IN_PRODUCTION (chờ layout)
        newStatus = 'IN_PRODUCTION'
        break
      case 'MINOR':
      case 'MAJOR':
        newStatus = 'REVISION'
        break
      case 'REJECT':
        newStatus = 'REJECTED'
        break
    }

    // ✅ Two-person rule cho bài SECRET và TOP_SECRET
    if ((submission.securityLevel === 'SECRET' || submission.securityLevel === 'TOP_SECRET') && decision === 'ACCEPT') {
      // Kiểm tra xem có đủ 2 người ký chưa (EIC + SECURITY_AUDITOR)
      const approvals = await prisma.editorDecision.findMany({
        where: {
          submissionId: id,
          roundNo,
          decision: 'ACCEPT'
        },
        include: {
          editor: {
            select: {
              role: true
            }
          }
        }
      })

      const hasEICApproval = approvals.some(a => a.editor.role === 'EIC')
      const hasSecurityApproval = approvals.some(a => a.editor.role === 'SECURITY_AUDITOR')

      if (!hasEICApproval || !hasSecurityApproval) {
        // Chưa đủ 2 chữ ký → giữ nguyên status, chờ người còn lại ký
        return NextResponse.json({
          success: true,
          decision: editorDecision,
          message: `Bài ${submission.securityLevel} cần 2 chữ ký (EIC + SECURITY_AUDITOR). Chờ người còn lại phê duyệt.`,
          requiresAdditionalApproval: true
        })
      }
    }

    await prisma.submission.update({
      where: { id },
      data: { status: newStatus }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'EDITOR_DECISION',
        object: `submission:${id}`,
        after: { decision, roundNo, newStatus } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      decision: editorDecision,
      message: 'Quyết định đã được ghi nhận'
    })
  } catch (error) {
    logger.error({ message: 'Error making decision:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi đưa ra quyết định' },
      { status: 500 }
    )
  }
}
