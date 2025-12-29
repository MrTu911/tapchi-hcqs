export const dynamic = "force-dynamic"


import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { handleError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/users/pending
 * Lấy danh sách người dùng chờ duyệt
 * Chỉ ADMIN, EIC, MANAGING_EDITOR mới có quyền
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    

    // Kiểm tra quyền
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(user.role)) {
      return errorResponse('Không có quyền truy cập', 403)
    }

    // Lấy tham số query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    // Lọc người dùng
    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          org: true,
          requestedRole: true,
          role: true,
          status: true,
          isActive: true,
          rank: true,
          position: true,
          academicTitle: true,
          academicDegree: true,
          cvUrl: true,
          workCardUrl: true,
          emailVerified: true,
          createdAt: true,
          approvedBy: true,
          approvedAt: true,
          rejectionReason: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return successResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error({ context: "API_ADMIN", message: "Get pending users error:", error: error instanceof Error ? error.message : String(error) })
    return errorResponse('Lỗi server')
  }
}
