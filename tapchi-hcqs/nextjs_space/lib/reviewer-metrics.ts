
/**
 * Phase 3: Reviewer Metrics & Performance Analytics
 * Tính toán và phân tích hiệu suất của reviewer
 */

import { prisma } from './prisma';

export interface ReviewerMetrics {
  reviewerId: string;
  reviewerName: string;
  email: string;
  
  // Thống kê tổng quan
  totalInvited: number;
  totalAccepted: number;
  totalDeclined: number;
  totalCompleted: number;
  
  // Tỷ lệ
  acceptanceRate: number; // % accepted / invited
  completionRate: number; // % completed / accepted
  declineRate: number; // % declined / invited
  
  // Thời gian
  avgCompletionDays: number;
  onTimeRate: number; // % completed before deadline
  
  // Chất lượng
  avgQualityRating: number;
  
  // Phân bố recommendation
  recommendationDistribution: {
    ACCEPT: number;
    MINOR: number;
    MAJOR: number;
    REJECT: number;
  };
  
  // Workload
  currentLoad: number;
  maxLoad: number;
}

/**
 * Lấy metrics cho một reviewer cụ thể
 */
export async function getReviewerMetrics(reviewerId: string): Promise<ReviewerMetrics | null> {
  const user = await prisma.user.findUnique({
    where: { id: reviewerId },
    include: {
      reviewerProfile: true,
      reviews: {
        select: {
          invitedAt: true,
          acceptedAt: true,
          declinedAt: true,
          submittedAt: true,
          deadline: true,
          recommendation: true,
          qualityRating: true
        }
      }
    }
  });

  if (!user) return null;

  const reviews = user.reviews;
  
  const totalInvited = reviews.length;
  const totalAccepted = reviews.filter(r => r.acceptedAt).length;
  const totalDeclined = reviews.filter(r => r.declinedAt).length;
  const totalCompleted = reviews.filter(r => r.submittedAt).length;
  
  const acceptanceRate = totalInvited > 0 ? (totalAccepted / totalInvited) * 100 : 0;
  const completionRate = totalAccepted > 0 ? (totalCompleted / totalAccepted) * 100 : 0;
  const declineRate = totalInvited > 0 ? (totalDeclined / totalInvited) * 100 : 0;
  
  // Tính avg completion days
  const completedWithDates = reviews.filter(r => r.submittedAt && r.invitedAt);
  let avgCompletionDays = 0;
  if (completedWithDates.length > 0) {
    const totalDays = completedWithDates.reduce((sum, r) => {
      const days = Math.floor(
        (r.submittedAt!.getTime() - r.invitedAt!.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    avgCompletionDays = totalDays / completedWithDates.length;
  }
  
  // Tính on-time rate
  const completedWithDeadline = reviews.filter(r => r.submittedAt && r.deadline);
  const onTimeCount = completedWithDeadline.filter(r => 
    r.submittedAt! <= r.deadline!
  ).length;
  const onTimeRate = completedWithDeadline.length > 0 
    ? (onTimeCount / completedWithDeadline.length) * 100 
    : 0;
  
  // Tính avg quality rating
  const ratedReviews = reviews.filter(r => r.qualityRating !== null);
  const avgQualityRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / ratedReviews.length
    : 0;
  
  // Recommendation distribution
  const recommendationDistribution = {
    ACCEPT: reviews.filter(r => r.recommendation === 'ACCEPT').length,
    MINOR: reviews.filter(r => r.recommendation === 'MINOR').length,
    MAJOR: reviews.filter(r => r.recommendation === 'MAJOR').length,
    REJECT: reviews.filter(r => r.recommendation === 'REJECT').length
  };
  
  // Current load
  const currentLoad = await prisma.review.count({
    where: {
      reviewerId,
      submittedAt: null,
      declinedAt: null,
      deadline: {
        gte: new Date()
      }
    }
  });

  return {
    reviewerId,
    reviewerName: user.fullName,
    email: user.email,
    totalInvited,
    totalAccepted,
    totalDeclined,
    totalCompleted,
    acceptanceRate,
    completionRate,
    declineRate,
    avgCompletionDays,
    onTimeRate,
    avgQualityRating,
    recommendationDistribution,
    currentLoad,
    maxLoad: user.reviewerProfile?.maxConcurrentReviews || 5
  };
}

/**
 * Lấy metrics cho tất cả reviewers (dùng cho dashboard)
 */
export async function getAllReviewersMetrics(): Promise<ReviewerMetrics[]> {
  const reviewers = await prisma.user.findMany({
    where: {
      role: 'REVIEWER',
      isActive: true
    },
    select: {
      id: true
    }
  });

  const metricsPromises = reviewers.map(r => getReviewerMetrics(r.id));
  const allMetrics = await Promise.all(metricsPromises);
  
  return allMetrics.filter((m): m is ReviewerMetrics => m !== null);
}

/**
 * Lấy top performers
 */
export async function getTopReviewers(limit: number = 10): Promise<ReviewerMetrics[]> {
  const allMetrics = await getAllReviewersMetrics();
  
  // Sắp xếp theo quality rating và completion rate
  return allMetrics
    .sort((a, b) => {
      const scoreA = (a.avgQualityRating * 0.6) + (a.completionRate * 0.4);
      const scoreB = (b.avgQualityRating * 0.6) + (b.completionRate * 0.4);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
