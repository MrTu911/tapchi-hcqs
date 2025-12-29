export const dynamic = "force-dynamic"



import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { handleError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/users/stats
 * Lấy thống kê đăng ký người dùng
 * Chỉ ADMIN, EIC, MANAGING_EDITOR mới có quyền
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    

    // Kiểm tra quyền
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(user.role)) {
      return errorResponse('Không có quyền truy cập', 403)
    }

    // Lấy thống kê tổng quan
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      verifiedEmails,
      unverifiedEmails
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { status: 'REJECTED' } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.count({ where: { emailVerified: false } })
    ])

    // Thống kê theo vai trò
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true
      }
    })

    // Thống kê theo trạng thái
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    })

    // Thống kê đăng ký theo tháng (6 tháng gần nhất)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const registrationsByMonth = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
    `

    // Thống kê đăng ký theo vai trò mong muốn
    const requestedRolesStats = await prisma.user.groupBy({
      by: ['requestedRole'],
      where: {
        requestedRole: { not: null }
      },
      _count: {
        _all: true
      }
    })

    // Người dùng mới nhất chờ duyệt
    const recentPendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        requestedRole: true,
        org: true,
        createdAt: true,
        emailVerified: true
      }
    })

    // Tỷ lệ phê duyệt
    const approvalRate = totalUsers > 0 
      ? ((approvedUsers / totalUsers) * 100).toFixed(2)
      : '0.00'

    const rejectionRate = totalUsers > 0
      ? ((rejectedUsers / totalUsers) * 100).toFixed(2)
      : '0.00'

    return successResponse({
      summary: {
        total: totalUsers,
        pending: pendingUsers,
        approved: approvedUsers,
        rejected: rejectedUsers,
        emailVerified: verifiedEmails,
        emailUnverified: unverifiedEmails,
        approvalRate: parseFloat(approvalRate),
        rejectionRate: parseFloat(rejectionRate)
      },
      byRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count._all
      })),
      byStatus: usersByStatus.map(item => ({
        status: item.status,
        count: item._count._all
      })),
      byMonth: registrationsByMonth,
      requestedRoles: requestedRolesStats.map(item => ({
        role: item.requestedRole,
        count: item._count._all
      })),
      recentPending: recentPendingUsers
    })
  } catch (error) {
    logger.error({ context: "API_ADMIN", message: "User stats error:", error: error instanceof Error ? error.message : String(error) })
    return errorResponse('Lỗi server')
  }
}
