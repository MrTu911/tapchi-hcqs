
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'

/**
 * API thống kê chi tiết cho Admin Dashboard
 * Trả về: users, submissions, issues, articles, reviews, recent logs, new users
 */
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user || !can.admin(user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Lấy thời điểm 30 ngày trước
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Lấy tất cả thống kê song song
    const [
      // 1. Tổng số người dùng
      totalUsers,
      
      // 2. Người dùng theo vai trò
      usersByRole,
      
      // 3. Tổng số bài nộp
      totalSubmissions,
      
      // 4. Bài nộp theo trạng thái
      submissionsByStatus,
      
      // 5. Tổng số tạp chí
      totalIssues,
      
      // 6. Tạp chí xuất bản
      publishedIssues,
      
      // 7. Tổng số bài báo
      totalArticles,
      
      // 8. Reviewer hoạt động (30 ngày)
      activeReviewers,
      
      // 9. Hoạt động gần đây
      recentLogs,
      
      // 10. Người dùng mới
      newUsers,
      
      // 11. Bài nộp mới (7 ngày)
      recentSubmissions,
      
      // 12. Review stats
      totalReviews,
      completedReviews,
      pendingReviews,
    ] = await Promise.all([
      // 1. Tổng users
      prisma.user.count(),
      
      // 2. Users theo role
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      
      // 3. Tổng submissions
      prisma.submission.count(),
      
      // 4. Submissions theo status
      prisma.submission.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // 5. Tổng issues
      prisma.issue.count(),
      
      // 6. Published issues
      prisma.issue.count({
        where: { status: 'PUBLISHED' }
      }),
      
      // 7. Tổng articles
      prisma.article.count(),
      
      // 8. Active reviewers (có review trong 30 ngày)
      prisma.review.groupBy({
        by: ['reviewerId'],
        where: {
          OR: [
            { submittedAt: { gte: thirtyDaysAgo } },
            { invitedAt: { gte: thirtyDaysAgo } }
          ]
        }
      }).then(result => result.length),
      
      // 9. Recent logs
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              fullName: true,
              role: true
            }
          }
        }
      }),
      
      // 10. New users (30 ngày)
      prisma.user.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      
      // 11. Recent submissions
      prisma.submission.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: {
            select: { fullName: true }
          }
        }
      }),
      
      // 12. Review stats
      prisma.review.count(),
      prisma.review.count({ where: { submittedAt: { not: null } } }),
      prisma.review.count({ where: { submittedAt: null, declinedAt: null } }),
    ])

    // Format dữ liệu cho biểu đồ
    const userRoleData = usersByRole.map(item => ({
      role: item.role,
      count: item._count.id
    }))

    const submissionStatusData = submissionsByStatus.map(item => ({
      status: item.status,
      count: item._count.id
    }))

    // Tính tỷ lệ
    const acceptanceRate = totalSubmissions > 0 
      ? ((submissionsByStatus.find(s => s.status === 'ACCEPTED')?._count?.id || 0) / totalSubmissions * 100).toFixed(1)
      : '0'

    const reviewCompletionRate = totalReviews > 0
      ? (completedReviews / totalReviews * 100).toFixed(1)
      : '0'

    return NextResponse.json({
      success: true,
      data: {
        // Cards thống kê chính
        overview: {
          totalUsers,
          totalSubmissions,
          totalIssues,
          publishedIssues,
          totalArticles,
          activeReviewers,
          totalReviews,
          completedReviews,
          pendingReviews,
          acceptanceRate,
          reviewCompletionRate
        },
        
        // Dữ liệu cho biểu đồ
        charts: {
          usersByRole: userRoleData,
          submissionsByStatus: submissionStatusData
        },
        
        // Recent activity
        recentLogs: recentLogs.map(log => ({
          id: log.id.toString(),
          actor: log.actor?.fullName || 'Hệ thống',
          actorRole: log.actor?.role,
          action: log.action,
          object: log.object,
          objectId: log.objectId,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt
        })),
        
        // New users
        newUsers: newUsers.map(u => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        })),
        
        // Recent submissions
        recentSubmissions: recentSubmissions.map(s => ({
          id: s.id,
          title: s.title,
          author: s.author.fullName,
          status: s.status,
          createdAt: s.createdAt
        }))
      }
    })
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
