
/**
 * 📊 API: Statistics Overview (Optimized)
 * GET /api/statistics/overview
 * 
 * Tổng quan thống kê toàn hệ thống với cache 10 phút
 * Tối ưu bằng Promise.all và groupBy
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getCachedData } from '@/lib/cache';
import { convertBigInts } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface OverviewStats {
  system: {
    users: number;
    articles: number;
    issues: number;
    categories: number;
  };
  workflow: {
    submissions: number;
    reviews: number;
    decisions: number;
  };
  submissionStatus: {
    new: number;
    underReview: number;
    revision: number;
    accepted: number;
    rejected: number;
    published: number;
    overdue: number;
  };
  reviewStatus: {
    pending: number;
    completed: number;
    declined: number;
  };
  updatedAt: Date;
}

async function fetchOverviewStats(): Promise<OverviewStats> {
  // Batch queries để tối ưu hiệu năng
  const [
    users,
    articles,
    issues,
    categories,
    submissions,
    reviews,
    decisions,
    submissionsByStatus,
    reviewsByStatus,
    overdueCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.issue.count(),
    prisma.category.count(),
    prisma.submission.count(),
    prisma.review.count(),
    prisma.editorDecision.count(),
    
    // Group submissions by status
    prisma.submission.groupBy({
      by: ['status'],
      _count: { _all: true }
    }),
    
    // Count reviews by completion status
    Promise.all([
      prisma.review.count({ where: { submittedAt: null, declinedAt: null } }), // pending
      prisma.review.count({ where: { submittedAt: { not: null } } }), // completed
      prisma.review.count({ where: { declinedAt: { not: null } } }), // declined
    ]),
    
    // Overdue submissions
    prisma.submission.count({ where: { isOverdue: true } })
  ]);

  // Parse submission status
  const statusMap = new Map(
    submissionsByStatus.map(item => [item.status, item._count._all])
  );

  return {
    system: {
      users,
      articles,
      issues,
      categories
    },
    workflow: {
      submissions,
      reviews,
      decisions
    },
    submissionStatus: {
      new: statusMap.get('NEW') || 0,
      underReview: statusMap.get('UNDER_REVIEW') || 0,
      revision: statusMap.get('REVISION') || 0,
      accepted: statusMap.get('ACCEPTED') || 0,
      rejected: statusMap.get('REJECTED') || 0,
      published: statusMap.get('PUBLISHED') || 0,
      overdue: overdueCount
    },
    reviewStatus: {
      pending: reviewsByStatus[0],
      completed: reviewsByStatus[1],
      declined: reviewsByStatus[2]
    },
    updatedAt: new Date()
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ ADMIN, MANAGING_EDITOR, EIC mới xem được
    if (!['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Lấy từ cache hoặc tính toán (cache 10 phút)
    const stats = await getCachedData(
      'stats:overview',
      fetchOverviewStats,
      600 // 10 phút
    );
    
    // Convert BigInt to numbers
    const convertedStats = convertBigInts(stats);

    return NextResponse.json({
      success: true,
      data: convertedStats
    });

  } catch (error: any) {
    console.error('❌ Error fetching overview statistics:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

