
/**
 * Phase 3: Editor Analytics
 * Tổng hợp chỉ số và phân tích cho Editor-in-Chief dashboard
 */

import { prisma } from './prisma';
import { SubmissionStatus, Recommendation } from '@prisma/client';

export interface EditorAnalytics {
  overview: {
    totalSubmissions: number;
    activeSubmissions: number;
    completedSubmissions: number;
    avgProcessingDays: number;
    acceptanceRate: number;
  };
  
  byStatus: {
    status: SubmissionStatus;
    count: number;
    percentage: number;
  }[];
  
  byCategory: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  
  timeline: {
    month: string;
    submitted: number;
    accepted: number;
    rejected: number;
  }[];
  
  reviewerWorkload: {
    totalActiveReviewers: number;
    avgReviewsPerReviewer: number;
    overloadedReviewers: number;
  };
  
  performanceMetrics: {
    avgReviewTurnaroundDays: number;
    avgRevisionTurnaroundDays: number;
    avgTimeToDecision: number;
  };
}

/**
 * Lấy analytics tổng quan cho Editor
 */
export async function getEditorAnalytics(
  dateRange?: { from: Date; to: Date }
): Promise<EditorAnalytics> {
  const whereClause = dateRange ? {
    createdAt: {
      gte: dateRange.from,
      lte: dateRange.to
    }
  } : {};

  // 1. Overview statistics
  const totalSubmissions = await prisma.submission.count({ where: whereClause });
  
  const activeStatuses: SubmissionStatus[] = ['NEW', 'UNDER_REVIEW', 'REVISION'];
  const activeSubmissions = await prisma.submission.count({
    where: {
      ...whereClause,
      status: { in: activeStatuses }
    }
  });
  
  const completedStatuses: SubmissionStatus[] = ['ACCEPTED', 'REJECTED', 'PUBLISHED'];
  const completedSubmissions = await prisma.submission.count({
    where: {
      ...whereClause,
      status: { in: completedStatuses }
    }
  });
  
  // Tính avg processing days
  const completedWithDates = await prisma.submission.findMany({
    where: {
      ...whereClause,
      status: { in: completedStatuses }
    },
    select: {
      createdAt: true,
      decisions: {
        orderBy: { decidedAt: 'desc' },
        take: 1,
        select: { decidedAt: true }
      }
    }
  });
  
  let avgProcessingDays = 0;
  const validSubmissions = completedWithDates.filter(s => s.decisions.length > 0);
  if (validSubmissions.length > 0) {
    const totalDays = validSubmissions.reduce((sum, s) => {
      const days = Math.floor(
        (s.decisions[0].decidedAt.getTime() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    avgProcessingDays = totalDays / validSubmissions.length;
  }
  
  // Acceptance rate
  const acceptedCount = await prisma.submission.count({
    where: {
      ...whereClause,
      status: 'ACCEPTED'
    }
  });
  const acceptanceRate = completedSubmissions > 0 
    ? (acceptedCount / completedSubmissions) * 100 
    : 0;

  // 2. By Status
  const statusCounts = await prisma.submission.groupBy({
    by: ['status'],
    where: whereClause,
    _count: true
  });
  
  const byStatus = statusCounts.map(item => ({
    status: item.status,
    count: item._count,
    percentage: totalSubmissions > 0 ? (item._count / totalSubmissions) * 100 : 0
  }));

  // 3. By Category
  const categoryCounts = await prisma.submission.groupBy({
    by: ['categoryId'],
    where: {
      ...whereClause,
      categoryId: { not: null }
    },
    _count: true
  });
  
  const categoryIds = categoryCounts.map(c => c.categoryId).filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true }
  });
  
  const byCategory = categoryCounts.map(item => {
    const category = categories.find(c => c.id === item.categoryId);
    return {
      categoryId: item.categoryId || 'unknown',
      categoryName: category?.name || 'Unknown',
      count: item._count
    };
  });

  // 4. Timeline (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const timelineData = await prisma.submission.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      createdAt: true,
      status: true
    }
  });
  
  const monthlyStats = new Map<string, { submitted: number; accepted: number; rejected: number }>();
  
  timelineData.forEach(sub => {
    const monthKey = sub.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyStats.has(monthKey)) {
      monthlyStats.set(monthKey, { submitted: 0, accepted: 0, rejected: 0 });
    }
    const stats = monthlyStats.get(monthKey)!;
    stats.submitted++;
    if (sub.status === 'ACCEPTED') stats.accepted++;
    if (sub.status === 'REJECTED') stats.rejected++;
  });
  
  const timeline = Array.from(monthlyStats.entries())
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 5. Reviewer Workload
  const totalActiveReviewers = await prisma.user.count({
    where: {
      role: 'REVIEWER',
      isActive: true
    }
  });
  
  const totalActiveReviews = await prisma.review.count({
    where: {
      submittedAt: null,
      declinedAt: null
    }
  });
  
  const avgReviewsPerReviewer = totalActiveReviewers > 0 
    ? totalActiveReviews / totalActiveReviewers 
    : 0;
  
  const reviewerLoads = await prisma.review.groupBy({
    by: ['reviewerId'],
    where: {
      submittedAt: null,
      declinedAt: null
    },
    _count: true
  });
  
  const overloadedReviewers = reviewerLoads.filter(r => r._count >= 5).length;

  // 6. Performance Metrics
  const allReviews = await prisma.review.findMany({
    select: {
      invitedAt: true,
      submittedAt: true
    }
  });
  
  const completedReviews = allReviews.filter(r => r.submittedAt && r.invitedAt);
  
  let avgReviewTurnaroundDays = 0;
  if (completedReviews.length > 0) {
    const totalDays = completedReviews.reduce((sum, r) => {
      const days = Math.floor(
        (r.submittedAt!.getTime() - r.invitedAt!.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    avgReviewTurnaroundDays = totalDays / completedReviews.length;
  }

  return {
    overview: {
      totalSubmissions,
      activeSubmissions,
      completedSubmissions,
      avgProcessingDays,
      acceptanceRate
    },
    byStatus,
    byCategory,
    timeline,
    reviewerWorkload: {
      totalActiveReviewers,
      avgReviewsPerReviewer,
      overloadedReviewers
    },
    performanceMetrics: {
      avgReviewTurnaroundDays,
      avgRevisionTurnaroundDays: 0, // TODO: Implement
      avgTimeToDecision: avgProcessingDays
    }
  };
}

/**
 * Lấy submission trend theo thời gian
 */
export async function getSubmissionTrend(months: number = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const submissions = await prisma.submission.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true,
      status: true
    }
  });
  
  const monthlyData = new Map<string, number>();
  
  submissions.forEach(sub => {
    const monthKey = sub.createdAt.toISOString().substring(0, 7);
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
  });
  
  return Array.from(monthlyData.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
