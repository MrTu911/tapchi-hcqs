import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { cache } from 'react';
import { convertBigInts } from '@/lib/utils';

/**
 * API để lấy thống kê tổng quan cho dashboard
 * GET /api/dashboard/summary
 */

// Cache function for 10 minutes
const getCachedSummary = cache(async () => {
  try {
    const [
      // Submissions
      totalSubmissions,
      newSubmissions,
      underReviewSubmissions,
      acceptedSubmissions,
      rejectedSubmissions,
      publishedSubmissions,
      
      // Users
      totalUsers,
      pendingUsers,
      activeAuthors,
      activeReviewers,
      
      // Reviews
      totalReviews,
      pendingReviews,
      completedReviews,
      
      // Issues & Articles
      totalIssues,
      publishedIssues,
      draftIssues,
      totalArticles,
      
      // Recent activity
      recentSubmissions,
      recentReviews,
      
      // Trends (last 6 months)
      submissionTrends,
    ] = await Promise.all([
      // Submissions statistics
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'NEW' } }),
      prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.submission.count({ where: { status: 'ACCEPTED' } }),
      prisma.submission.count({ where: { status: 'REJECTED' } }),
      prisma.submission.count({ where: { status: 'PUBLISHED' } }),
      
      // Users statistics
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'AUTHOR', isActive: true } }),
      prisma.user.count({ where: { role: 'REVIEWER', isActive: true } }),
      
      // Reviews statistics
      prisma.review.count(),
      prisma.review.count({ where: { submittedAt: null } }),
      prisma.review.count({ where: { submittedAt: { not: null } } }),
      
      // Issues & Articles
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PUBLISHED' } }),
      prisma.issue.count({ where: { status: 'DRAFT' } }),
      prisma.article.count(),
      
      // Recent submissions (last 5)
      prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          createdAt: true,
          author: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      
      // Recent reviews (last 5)
      prisma.review.findMany({
        take: 5,
        where: { submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          roundNo: true,
          recommendation: true,
          submittedAt: true,
          submission: {
            select: {
              title: true,
            },
          },
          reviewer: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      
      // Submission trends for last 6 months
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count
        FROM "Submission"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
    ]);

    // Calculate percentages
    const submissionsByStatus = [
      { status: 'NEW', count: newSubmissions, label: 'Mới nộp' },
      { status: 'UNDER_REVIEW', count: underReviewSubmissions, label: 'Đang phản biện' },
      { status: 'ACCEPTED', count: acceptedSubmissions, label: 'Đã chấp nhận' },
      { status: 'PUBLISHED', count: publishedSubmissions, label: 'Đã xuất bản' },
      { status: 'REJECTED', count: rejectedSubmissions, label: 'Từ chối' },
    ];

    return {
      submissions: {
        total: totalSubmissions,
        new: newSubmissions,
        underReview: underReviewSubmissions,
        accepted: acceptedSubmissions,
        rejected: rejectedSubmissions,
        published: publishedSubmissions,
        byStatus: submissionsByStatus,
      },
      users: {
        total: totalUsers,
        pending: pendingUsers,
        activeAuthors,
        activeReviewers,
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        completed: completedReviews,
        completionRate: totalReviews > 0 ? ((completedReviews / totalReviews) * 100).toFixed(1) : '0',
      },
      issues: {
        total: totalIssues,
        published: publishedIssues,
        draft: draftIssues,
      },
      articles: {
        total: totalArticles,
      },
      recentActivity: {
        submissions: recentSubmissions,
        reviews: recentReviews,
      },
      trends: {
        submissions: submissionTrends,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Chỉ admin và editor mới xem được dashboard summary
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'SECURITY_AUDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền xem thống kê', 403);
    }

    const summary = await getCachedSummary();
    
    // Convert all BigInt values to numbers before sending
    const convertedSummary = convertBigInts(summary);

    return NextResponse.json({
      success: true,
      data: convertedSummary,
    });
  } catch (error) {
    console.error('Error in dashboard summary API:', error);
    return errorResponse('Lỗi khi lấy thống kê dashboard', 500);
  }
}
