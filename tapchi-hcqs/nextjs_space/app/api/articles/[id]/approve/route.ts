
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'
import { ApprovalStatus } from '@prisma/client'

/**
 * POST /api/articles/[id]/approve
 * Kiểm duyệt bài báo (Chỉ SYSADMIN, EIC và MANAGING_EDITOR)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Kiểm tra quyền: SYSADMIN, EIC và MANAGING_EDITOR có quyền duyệt bài
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true }
    })

    if (!user || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền thực hiện thao tác này. Chỉ Quản trị viên, Tổng biên tập và Biên tập điều hành mới có quyền kiểm duyệt bài báo.' },
        { status: 403 }
      )
    }

    const { id } = await params;
    const body = await req.json()
    const { decision, note } = body

    // Validate decision
    const validDecisions: ApprovalStatus[] = ['APPROVED', 'REJECTED', 'REVISION_REQUIRED']
    if (!decision || !validDecisions.includes(decision as ApprovalStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision value' },
        { status: 400 }
      )
    }

    // Kiểm tra bài báo có tồn tại không
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            title: true,
            code: true,
            createdBy: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Bài báo không tồn tại' },
        { status: 404 }
      )
    }

    // Cập nhật trạng thái phê duyệt
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        approvalStatus: decision as ApprovalStatus,
        approvalNote: note || null,
        approvedBy: session.uid,
        approvedAt: new Date()
      }
    })

    // Tạo thông báo cho tác giả
    let notificationMessage = ''
    switch (decision) {
      case 'APPROVED':
        notificationMessage = `Bài báo "${article.submission.title}" đã được duyệt xuất bản`
        break
      case 'REJECTED':
        notificationMessage = `Bài báo "${article.submission.title}" đã bị từ chối`
        break
      case 'REVISION_REQUIRED':
        notificationMessage = `Bài báo "${article.submission.title}" yêu cầu chỉnh sửa`
        break
    }

    await prisma.notification.create({
      data: {
        userId: article.submission.createdBy,
        type: 'DECISION_MADE',
        title: 'Kết quả kiểm duyệt bài báo',
        message: notificationMessage + (note ? `\n\nGhi chú: ${note}` : ''),
        link: `/dashboard/author/submissions/${article.submissionId}`
      }
    })

    // Ghi log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'UPDATE',
        object: 'Article',
        objectId: id,
        metadata: JSON.stringify({ decision, note, articleCode: article.submission.code })
      }
    })

    let statusMessage = ''
    switch (decision) {
      case 'APPROVED':
        statusMessage = 'đã được duyệt'
        break
      case 'REJECTED':
        statusMessage = 'đã bị từ chối'
        break
      case 'REVISION_REQUIRED':
        statusMessage = 'yêu cầu chỉnh sửa'
        break
    }

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: `Bài báo ${statusMessage} thành công`
    })
  } catch (error) {
    console.error('Error approving article:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/articles/[id]/approve
 * Lấy thông tin trạng thái phê duyệt của bài báo
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        approvalStatus: true,
        approvalNote: true,
        approvedBy: true,
        approvedAt: true,
        submission: {
          select: {
            title: true,
            code: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Bài báo không tồn tại' },
        { status: 404 }
      )
    }

    // Lấy thông tin người duyệt
    let approver = null
    if (article.approvedBy) {
      approver = await prisma.user.findUnique({
        where: { id: article.approvedBy },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        approver
      }
    })
  } catch (error) {
    console.error('Error fetching article approval status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
