export const dynamic = "force-dynamic"

/**
 * POST /api/admin/users/approve
 * Mô tả: Phê duyệt hoặc từ chối tài khoản người dùng
 * Auth: Required (ADMIN, EIC, MANAGING_EDITOR)
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/responses'
import {
  sendEmail,
  getAccountApprovalEmailTemplate,
  getAccountRejectionEmailTemplate
} from '@/lib/email'
import { handleError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const approveSchema = z.object({
  userId: z.string().uuid('ID người dùng không hợp lệ'),
  action: z.enum(['APPROVE', 'REJECT']),
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
  rejectionReason: z.string().max(500).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_ADMIN_USER_APPROVE',
      message: 'User approval/rejection request'
    });

    const session = await requireAuth(request)

    // Kiểm tra quyền
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!approver || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(approver.role)) {
      throw new AuthorizationError('Không có quyền thực hiện thao tác này')
    }

    const body = await request.json()
    const validation = approveSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      const errorMessages = Object.entries(errors).map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`).join('; ')
      throw new ValidationError(`Dữ liệu không hợp lệ: ${errorMessages}`)
    }

    const { userId, action, role, rejectionReason } = validation.data

    // Lấy thông tin người dùng cần duyệt
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      throw new NotFoundError('Không tìm thấy người dùng')
    }

    if (targetUser.status !== 'PENDING') {
      throw new ValidationError('Tài khoản này đã được xử lý trước đó')
    }

    // Cập nhật trạng thái
    if (action === 'APPROVE') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'APPROVED',
          isActive: true,
          role: role || targetUser.requestedRole || 'AUTHOR',
          approvedBy: approver.id,
          approvedAt: new Date()
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          isActive: true
        }
      })

      // Gửi email thông báo phê duyệt thành công
      try {
        const approvalEmail = getAccountApprovalEmailTemplate(
          updatedUser.fullName,
          updatedUser.role,
          'vi'
        )

        await sendEmail({
          to: updatedUser.email,
          subject: approvalEmail.subject,
          html: approvalEmail.html,
          text: approvalEmail.text
        })
      } catch (emailError) {
        logger.error({
          context: 'API_ADMIN_USER_APPROVE',
          message: 'Error sending approval email',
          error: emailError instanceof Error ? emailError.message : String(emailError)
        });
        // Don't fail the approval if email fails
      }
      
      // Ghi log
      await prisma.auditLog.create({
        data: {
          action: 'USER_APPROVED',
          actorId: approver.id,
          object: 'User',
          objectId: userId,
          metadata: {
            approvedRole: updatedUser.role,
            approverName: approver.fullName
          }
        }
      })

      // Log success
      logger.info({
        context: 'API_ADMIN_USER_APPROVE',
        message: 'User approved successfully',
        userId,
        approvedRole: updatedUser.role,
        approverId: approver.id
      });

      return successResponse(updatedUser, 'Phê duyệt tài khoản thành công')
    } else {
      // Từ chối
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'REJECTED',
          isActive: false,
          rejectionReason,
          approvedBy: approver.id,
          approvedAt: new Date()
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          rejectionReason: true
        }
      })

      // Gửi email thông báo từ chối kèm lý do
      try {
        const rejectionEmail = getAccountRejectionEmailTemplate(
          updatedUser.fullName,
          rejectionReason || 'Không đáp ứng yêu cầu',
          'vi'
        )

        await sendEmail({
          to: updatedUser.email,
          subject: rejectionEmail.subject,
          html: rejectionEmail.html,
          text: rejectionEmail.text
        })
      } catch (emailError) {
        logger.error({
          context: 'API_ADMIN_USER_APPROVE',
          message: 'Error sending rejection email',
          error: emailError instanceof Error ? emailError.message : String(emailError)
        });
        // Don't fail the rejection if email fails
      }
      
      // Ghi log
      await prisma.auditLog.create({
        data: {
          action: 'USER_REJECTED',
          actorId: approver.id,
          object: 'User',
          objectId: userId,
          metadata: {
            rejectionReason,
            approverName: approver.fullName
          }
        }
      })

      // Log success
      logger.info({
        context: 'API_ADMIN_USER_APPROVE',
        message: 'User rejected successfully',
        userId,
        rejectionReason,
        approverId: approver.id
      });

      return successResponse(updatedUser, 'Đã từ chối tài khoản')
    }
  } catch (error) {
    logger.error({
      context: 'API_ADMIN_USER_APPROVE',
      message: 'User approval/rejection failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_ADMIN_USER_APPROVE')
  }
}
