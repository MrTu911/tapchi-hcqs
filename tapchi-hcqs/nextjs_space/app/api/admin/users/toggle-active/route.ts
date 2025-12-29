export const dynamic = "force-dynamic"


import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { z } from 'zod'
import { handleError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

const toggleSchema = z.object({
  userId: z.string().uuid('ID người dùng không hợp lệ'),
  isActive: z.boolean()
})

/**
 * POST /api/admin/users/toggle-active
 * Tạm khóa / mở khóa tài khoản người dùng
 * Chỉ ADMIN, EIC mới có quyền
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Kiểm tra quyền
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!admin || !['SYSADMIN', 'EIC'].includes(admin.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403)
    }

    const body = await request.json()
    const validation = toggleSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse('Dữ liệu không hợp lệ', 400)
    }

    const { userId, isActive } = validation.data

    // Không cho phép tự khóa chính mình
    if (userId === admin.id) {
      return errorResponse('Không thể khóa tài khoản của chính bạn', 400)
    }

    // Lấy thông tin người dùng
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return errorResponse('Không tìm thấy người dùng', 404)
    }

    // Cập nhật trạng thái
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    // Ghi log
    await prisma.auditLog.create({
      data: {
        action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        actorId: admin.id,
        object: 'User',
        objectId: userId,
        metadata: {
          targetUserName: targetUser.fullName,
          adminName: admin.fullName
        }
      }
    })

    return successResponse(
      updatedUser, 
      isActive ? 'Đã mở khóa tài khoản' : 'Đã tạm khóa tài khoản'
    )
  } catch (error) {
    logger.error({ context: "API_ADMIN", message: "Toggle active user error:", error: error instanceof Error ? error.message : String(error) })
    return errorResponse('Lỗi server')
  }
}
