import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/admin/monitor
 * Fetch system monitoring metrics
 * Only accessible by EIC and SYSADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only EIC and SYSADMIN can access monitoring
    if (session.role !== Role.EIC && session.role !== Role.SYSADMIN) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get time range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // Fetch all metrics in parallel
    const [
      // User statistics
      totalUsers,
      activeUsers,
      usersByRole,
      newUsersThisMonth,
      
      // Submission statistics
      totalSubmissions,
      submissionsByStatus,
      submissionsThisMonth,
      
      // Article statistics
      totalArticles,
      articlesThisMonth,
      
      // Issue statistics
      totalIssues,
      publishedIssues,
      
      // Review statistics
      totalReviews,
      pendingReviews,
      completedReviews,
      
      // System activity
      recentAudits,
      auditCount,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Submissions
      prisma.submission.count(),
      prisma.submission.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.submission.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Articles
      prisma.article.count(),
      prisma.article.count({
        where: {
          publishedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Issues
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PUBLISHED' } }),
      
      // Reviews
      prisma.review.count(),
      prisma.review.count({
        where: {
          submittedAt: null,
        },
      }),
      prisma.review.count({
        where: { submittedAt: { not: null } },
      }),
      
      // Audit logs
      prisma.auditLog.findMany({
        where: { createdAt: { gte: dateFrom } },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.auditLog.count({
        where: { createdAt: { gte: dateFrom } },
      }),
    ]);
    
    // Calculate submission trend (last 6 months)
    const submissionTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const count = await prisma.submission.count({
        where: {
          createdAt: {
            gte: monthDate,
            lt: nextMonth,
          },
        },
      });
      
      submissionTrend.push({
        month: monthDate.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        count,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole.map((r) => ({
            role: r.role,
            count: r._count,
          })),
          newThisMonth: newUsersThisMonth,
        },
        submissions: {
          total: totalSubmissions,
          byStatus: submissionsByStatus.map((s) => ({
            status: s.status,
            count: s._count,
          })),
          thisMonth: submissionsThisMonth,
          trend: submissionTrend,
        },
        articles: {
          total: totalArticles,
          thisMonth: articlesThisMonth,
        },
        issues: {
          total: totalIssues,
          published: publishedIssues,
        },
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
          completed: completedReviews,
        },
        system: {
          auditLogs: auditCount,
          recentActivity: recentAudits,
        },
        period: {
          days,
          from: dateFrom.toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching monitor data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
