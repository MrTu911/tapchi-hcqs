/**
 * @fileoverview API route for Managing Editor statistics
 * @description Provides comprehensive statistics for Managing Editor dashboard
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
// authOptions not needed
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * GET /api/managing-editor/stats
 * Returns comprehensive statistics for Managing Editor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const userRole = session.role;
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];

    if (!allowedRoles.includes(userRole)) {
      return errorResponse('Access denied', 403);
    }

    // 1. Thống kê theo trạng thái
    const submissionsByStatus = await prisma.submission.groupBy({
      by: ['status'],
      _count: true
    });

    const statusStats = submissionsByStatus.map((item: any) => ({
      status: item.status,
      count: item._count
    }));

    // 2. Tổng số bài viết
    const totalSubmissions = await prisma.submission.count();

    // 3. Bài viết trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = await prisma.submission.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // 4. Bài đang chờ xử lý (NEW)
    const pendingSubmissions = await prisma.submission.count({
      where: {
        status: 'NEW'
      }
    });

    // 5. Bài đang phản biện
    const underReview = await prisma.submission.count({
      where: {
        status: 'UNDER_REVIEW'
      }
    });

    // 6. Bài cần chỉnh sửa
    const needsRevision = await prisma.submission.count({
      where: {
        status: 'REVISION'
      }
    });

    // 7. Bài đã chấp nhận
    const accepted = await prisma.submission.count({
      where: {
        status: 'ACCEPTED'
      }
    });

    // 8. Bài đã xuất bản
    const published = await prisma.submission.count({
      where: {
        status: 'PUBLISHED'
      }
    });

    // 9. Tỷ lệ chấp nhận
    const totalCompleted = accepted + await prisma.submission.count({
      where: {
        status: { in: ['REJECTED', 'DESK_REJECT'] }
      }
    });
    const acceptanceRate = totalCompleted > 0 ? (accepted / totalCompleted) * 100 : 0;

    // 10. Bài quá hạn deadline
    const now = new Date();
    const overdueSubmissions = await prisma.deadline.count({
      where: {
        dueDate: {
          lt: now
        },
        completedAt: null,
        submission: {
          status: {
            in: ['NEW', 'UNDER_REVIEW', 'REVISION']
          }
        }
      }
    });

    // 11. Số phản biện viên đang hoạt động
    const activeReviewers = await prisma.review.groupBy({
      by: ['reviewerId'],
      where: {
        submittedAt: null,
        declinedAt: null
      }
    });

    // 12. Số editors
    const totalEditors = await prisma.user.count({
      where: {
        role: {
          in: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC']
        },
        isActive: true
      }
    });

    // 13. Bài mới nhất chưa phân công
    const unassignedSubmissions = await prisma.submission.findMany({
      where: {
        status: 'NEW'
      },
      include: {
        author: {
          select: {
            fullName: true,
            email: true
          }
        },
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // 14. Review statistics
    const totalReviews = await prisma.review.count();
    const completedReviews = await prisma.review.count({
      where: {
        submittedAt: {
          not: null
        }
      }
    });
    const pendingReviews = await prisma.review.count({
      where: {
        submittedAt: null,
        declinedAt: null
      }
    });

    // 15. Thời gian xử lý trung bình (từ SUBMITTED → PUBLISHED)
    const publishedWithDates = await prisma.submission.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    // Simplified: Average processing days not calculated without updatedAt field
    const averageProcessingDays = 0;

    // 16. Top categories
    const submissionsByCategory = await prisma.submission.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: {
        _count: {
          categoryId: 'desc'
        }
      },
      take: 5
    });

    const topCategories = await Promise.all(
      submissionsByCategory
        .filter(item => item.categoryId !== null)
        .map(async (item) => {
          const category = await prisma.category.findUnique({
            where: { id: item.categoryId! }
          });
          return {
            categoryId: item.categoryId,
            categoryName: category?.name || 'Unknown',
            count: item._count
          };
        })
    );

    return successResponse({
      overview: {
        totalSubmissions,
        recentSubmissions,
        pendingSubmissions,
        underReview,
        needsRevision,
        accepted,
        published,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        overdueSubmissions,
        averageProcessingDays
      },
      statusStats,
      reviews: {
        total: totalReviews,
        completed: completedReviews,
        pending: pendingReviews,
        activeReviewers: activeReviewers.length
      },
      team: {
        totalEditors
      },
      topCategories,
      unassignedSubmissions: unassignedSubmissions.map(sub => ({
        id: sub.id,
        code: sub.code,
        title: sub.title,
        author: sub.author.fullName,
        authorEmail: sub.author.email,
        category: sub.category?.name || 'N/A',
        createdAt: sub.createdAt,
        securityLevel: sub.securityLevel
      }))
    });

  } catch (error: any) {
    console.error('Error fetching Managing Editor stats:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
