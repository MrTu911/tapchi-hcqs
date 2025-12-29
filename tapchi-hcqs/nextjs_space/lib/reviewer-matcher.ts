
/**
 * Phase 3: Reviewer Matching Engine
 * Tự động gợi ý reviewer phù hợp dựa trên keywords, expertise, và workload
 */

import { prisma } from './prisma';

export interface ReviewerSuggestion {
  id: string;
  userId: string;
  name: string;
  email: string;
  matchScore: number;
  expertise: string[];
  keywords: string[];
  currentLoad: number;
  available: boolean;
  avgCompletionDays: number;
  averageRating: number;
  totalReviews: number;
  lastReviewAt: Date | null;
}

/**
 * Tính điểm tương đồng giữa 2 mảng keywords
 */
function calculateSimilarity(arr1: string[], arr2: string[]): number {
  if (!arr1.length || !arr2.length) return 0;
  
  const set1 = new Set(arr1.map(k => k.toLowerCase().trim()));
  const set2 = new Set(arr2.map(k => k.toLowerCase().trim()));
  
  let intersection = 0;
  set1.forEach(item => {
    if (set2.has(item)) intersection++;
  });
  
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0; // Jaccard similarity
}

/**
 * Đếm số review đang pending của một reviewer
 */
async function getReviewerCurrentLoad(reviewerId: string): Promise<number> {
  const count = await prisma.review.count({
    where: {
      reviewerId,
      submittedAt: null,
      declinedAt: null,
      deadline: {
        gte: new Date()
      }
    }
  });
  return count;
}

/**
 * Gợi ý reviewer cho một submission
 */
export async function suggestReviewers(
  submissionId: string,
  options?: {
    limit?: number;
    minMatchScore?: number;
    excludeReviewerIds?: string[];
  }
): Promise<ReviewerSuggestion[]> {
  const { limit = 10, minMatchScore = 0.2, excludeReviewerIds = [] } = options || {};

  // 1. Lấy thông tin submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      category: true,
      author: true
    }
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  const submissionKeywords = submission.keywords || [];
  
  // 2. Tìm tất cả reviewer profiles có sẵn
  const reviewerProfiles = await prisma.reviewerProfile.findMany({
    where: {
      isAvailable: true,
      userId: {
        notIn: [submission.createdBy, ...excludeReviewerIds]
      },
      user: {
        isActive: true
      }
    },
    include: {
      user: true
    }
  });

  // 3. Tính toán match score cho từng reviewer
  const suggestions: ReviewerSuggestion[] = [];

  for (const profile of reviewerProfiles) {
    // Kiểm tra unavailable period
    if (profile.unavailableUntil && profile.unavailableUntil > new Date()) {
      continue;
    }

    // Tính similarity dựa trên keywords
    const keywordScore = calculateSimilarity(submissionKeywords, profile.keywords);
    
    // Kiểm tra category/expertise overlap
    let expertiseScore = 0;
    if (submission.category && profile.expertise.length > 0) {
      const categoryName = submission.category.name.toLowerCase();
      const hasExpertise = profile.expertise.some(exp => 
        categoryName.includes(exp.toLowerCase()) || exp.toLowerCase().includes(categoryName)
      );
      expertiseScore = hasExpertise ? 0.3 : 0;
    }

    // Tổng hợp match score (weighted average)
    const matchScore = (keywordScore * 0.7) + (expertiseScore * 0.3);

    if (matchScore < minMatchScore) {
      continue;
    }

    // Lấy current load
    const currentLoad = await getReviewerCurrentLoad(profile.userId);

    // Kiểm tra xem reviewer có đang quá tải không
    if (currentLoad >= profile.maxConcurrentReviews) {
      continue;
    }

    suggestions.push({
      id: profile.id,
      userId: profile.userId,
      name: profile.user.fullName,
      email: profile.user.email,
      matchScore,
      expertise: profile.expertise,
      keywords: profile.keywords,
      currentLoad,
      available: currentLoad < profile.maxConcurrentReviews,
      avgCompletionDays: profile.avgCompletionDays,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      lastReviewAt: profile.lastReviewAt
    });
  }

  // 4. Sắp xếp theo match score và performance
  suggestions.sort((a, b) => {
    // Ưu tiên match score cao
    if (Math.abs(a.matchScore - b.matchScore) > 0.1) {
      return b.matchScore - a.matchScore;
    }
    
    // Nếu match score tương đương, ưu tiên load thấp hơn
    if (a.currentLoad !== b.currentLoad) {
      return a.currentLoad - b.currentLoad;
    }
    
    // Nếu load bằng nhau, ưu tiên rating cao hơn
    return b.averageRating - a.averageRating;
  });

  return suggestions.slice(0, limit);
}

/**
 * Cập nhật thống kê reviewer profile sau khi review hoàn thành
 */
export async function updateReviewerStatistics(reviewerId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { reviewerId },
    select: {
      submittedAt: true,
      invitedAt: true,
      declinedAt: true,
      qualityRating: true
    }
  });

  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.submittedAt).length;
  const declinedReviews = reviews.filter(r => r.declinedAt).length;

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

  // Tính avg quality rating
  const ratedReviews = reviews.filter(r => r.qualityRating !== null);
  let averageRating = 0;
  if (ratedReviews.length > 0) {
    const totalRating = ratedReviews.reduce((sum, r) => sum + (r.qualityRating || 0), 0);
    averageRating = totalRating / ratedReviews.length;
  }

  // Tìm last review date
  const lastReview = reviews
    .filter(r => r.submittedAt)
    .sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime())[0];

  // Cập nhật profile
  await prisma.reviewerProfile.upsert({
    where: { userId: reviewerId },
    update: {
      totalReviews,
      completedReviews,
      declinedReviews,
      avgCompletionDays,
      averageRating,
      lastReviewAt: lastReview?.submittedAt || null
    },
    create: {
      userId: reviewerId,
      expertise: [],
      keywords: [],
      totalReviews,
      completedReviews,
      declinedReviews,
      avgCompletionDays,
      averageRating,
      lastReviewAt: lastReview?.submittedAt || null
    }
  });
}

/**
 * Cập nhật keywords và expertise cho reviewer profile
 */
export async function updateReviewerExpertise(
  reviewerId: string,
  expertise: string[],
  keywords: string[]
): Promise<void> {
  await prisma.reviewerProfile.upsert({
    where: { userId: reviewerId },
    update: { expertise, keywords },
    create: {
      userId: reviewerId,
      expertise,
      keywords
    }
  });
}
