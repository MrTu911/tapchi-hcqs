import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * @route GET /api/admin/metrics
 * @description Get comprehensive system metrics and analytics
 * @access Private (MANAGING_EDITOR, EIC, SYSADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '6months'; // 6months, 1year, all

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined;
    
    switch(period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = undefined; // all time
    }

    // Article Metrics (simplified - no relations in schema)
    const articleMetrics = await prisma.articleMetrics.findMany({
      where: startDate ? {
        lastViewedAt: { gte: startDate }
      } : {},
      orderBy: { views: 'desc' },
      take: 10
    });

    // Submission Statistics
    const [totalSubmissions, publishedArticles, inReviewArticles, rejectedArticles] = await Promise.all([
      prisma.submission.count({
        where: startDate ? { createdAt: { gte: startDate } } : {}
      }),
      prisma.submission.count({
        where: {
          status: 'PUBLISHED',
          ...(startDate ? { createdAt: { gte: startDate } } : {})
        }
      }),
      prisma.submission.count({
        where: {
          status: { in: ['UNDER_REVIEW', 'REVISION'] },
          ...(startDate ? { createdAt: { gte: startDate } } : {})
        }
      }),
      prisma.submission.count({
        where: {
          status: 'REJECTED',
          ...(startDate ? { createdAt: { gte: startDate } } : {})
        }
      })
    ]);

    // Review Statistics
    const [totalReviews, completedReviews, pendingReviews, acceptedReviews, rejectedReviews] = await Promise.all([
      prisma.review.count({
        where: startDate ? { invitedAt: { gte: startDate } } : {}
      }),
      prisma.review.count({
        where: {
          submittedAt: { not: null },
          ...(startDate ? { invitedAt: { gte: startDate } } : {})
        }
      }),
      prisma.review.count({
        where: {
          submittedAt: null,
          declinedAt: null,
          ...(startDate ? { invitedAt: { gte: startDate } } : {})
        }
      }),
      prisma.review.count({
        where: {
          acceptedAt: { not: null },
          ...(startDate ? { invitedAt: { gte: startDate } } : {})
        }
      }),
      prisma.review.count({
        where: {
          declinedAt: { not: null },
          ...(startDate ? { invitedAt: { gte: startDate } } : {})
        }
      })
    ]);

    // User Statistics
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Category Statistics
    const categoryStats = await prisma.submission.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: startDate ? { createdAt: { gte: startDate } } : {},
      orderBy: { _count: { categoryId: 'desc' } },
      take: 10
    });

    const categoriesWithNames = await Promise.all(
      categoryStats.map(async (cat) => {
        if (!cat.categoryId) return { id: null, name: 'Uncategorized', count: cat._count.categoryId };
        const category = await prisma.category.findUnique({ where: { id: cat.categoryId } });
        return {
          id: cat.categoryId,
          name: category?.name || 'Unknown',
          count: cat._count.categoryId
        };
      })
    );

    // Workflow Timeline Statistics (commented out - model not in current schema)
    // const workflowStats = await prisma.workflowTimeline.groupBy({
    //   by: ['eventType'],
    //   _count: { eventType: true },
    //   where: startDate ? { createdAt: { gte: startDate } } : {}
    // });
    const workflowStats: any[] = []; // Placeholder

    // Deadline Statistics
    const [totalDeadlines, overDueDeadlines, completedDeadlines] = await Promise.all([
      prisma.deadline.count({
        where: startDate ? { createdAt: { gte: startDate } } : {}
      }),
      prisma.deadline.count({
        where: {
          dueDate: { lt: new Date() },
          completedAt: null,
          ...(startDate ? { createdAt: { gte: startDate } } : {})
        }
      }),
      prisma.deadline.count({
        where: {
          completedAt: { not: null },
          ...(startDate ? { createdAt: { gte: startDate } } : {})
        }
      })
    ]);

    // Top Performing Articles (by views + downloads + citations)
    const topArticles = articleMetrics.map(metric => ({
      articleId: metric.articleId,
      views: metric.views,
      downloads: metric.downloads,
      citations: metric.citations,
      totalScore: metric.views + (metric.downloads * 5) + (metric.citations * 10)
    })).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);

    return NextResponse.json({
      success: true,
      period,
      data: {
        submissions: {
          total: totalSubmissions,
          published: publishedArticles,
          inReview: inReviewArticles,
          rejected: rejectedArticles,
          acceptanceRate: totalSubmissions > 0 ? (publishedArticles / totalSubmissions * 100).toFixed(2) : 0
        },
        reviews: {
          total: totalReviews,
          completed: completedReviews,
          pending: pendingReviews,
          accepted: acceptedReviews,
          rejected: rejectedReviews,
          completionRate: totalReviews > 0 ? (completedReviews / totalReviews * 100).toFixed(2) : 0
        },
        users: userStats.map(stat => ({
          role: stat.role,
          count: stat._count.role
        })),
        categories: categoriesWithNames,
        // workflow: workflowStats.map(stat => ({
        //   eventType: stat.eventType,
        //   count: stat._count.eventType
        // })),
        deadlines: {
          total: totalDeadlines,
          overdue: overDueDeadlines,
          completed: completedDeadlines,
          onTimeRate: totalDeadlines > 0 ? (completedDeadlines / totalDeadlines * 100).toFixed(2) : 0
        },
        topArticles
      }
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
