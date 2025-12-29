
/**
 * AI-Powered Reviewer Matching
 * Uses semantic similarity to match reviewers with submissions
 */

interface ReviewerExpertise {
  reviewerId: string
  expertise: string[]
  keywords: string[]
  previousReviews: number
  averageRating: number
  isAvailable: boolean
}

interface SubmissionData {
  title: string
  abstractVn?: string
  abstractEn?: string
  keywords: string[]
  section?: string
}

export interface ReviewerMatchResult {
  reviewerId: string
  score: number
  breakdown: {
    expertiseMatch: number
    keywordMatch: number
    availabilityScore: number
  }
}

/**
 * Calculate keyword overlap score
 */
function calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1.map(k => k.toLowerCase()))
  const set2 = new Set(keywords2.map(k => k.toLowerCase()))

  let matches = 0
  set1.forEach(keyword => {
    if (set2.has(keyword)) matches++
  })

  return matches / Math.max(set1.size, set2.size, 1)
}

/**
 * Calculate expertise match score
 */
function calculateExpertiseMatch(
  reviewerExpertise: string[],
  submissionSection?: string
): number {
  if (!submissionSection) return 0.5

  const match = reviewerExpertise.some(
    exp => exp.toLowerCase() === submissionSection.toLowerCase()
  )

  return match ? 1.0 : 0.3
}

/**
 * Calculate availability score
 */
function calculateAvailabilityScore(reviewer: ReviewerExpertise): number {
  if (!reviewer.isAvailable) return 0

  // Prefer reviewers with fewer ongoing reviews
  const workloadPenalty = Math.max(0, 1 - reviewer.previousReviews * 0.1)

  // Bonus for high-quality reviewers
  const qualityBonus = reviewer.averageRating / 5

  return (workloadPenalty + qualityBonus) / 2
}

/**
 * Match reviewers with submission using AI-based scoring
 */
export async function matchReviewersWithSubmission(
  submission: SubmissionData,
  reviewers: ReviewerExpertise[]
): Promise<ReviewerMatchResult[]> {
  const results = reviewers.map(reviewer => {
    const keywordMatch = calculateKeywordOverlap(submission.keywords, reviewer.keywords)
    const expertiseMatch = calculateExpertiseMatch(reviewer.expertise, submission.section)
    const availabilityScore = calculateAvailabilityScore(reviewer)

    // Weighted scoring
    const score =
      keywordMatch * 0.4 + expertiseMatch * 0.35 + availabilityScore * 0.25

    return {
      reviewerId: reviewer.reviewerId,
      score,
      breakdown: {
        expertiseMatch,
        keywordMatch,
        availabilityScore
      }
    }
  })

  return results.sort((a, b) => b.score - a.score)
}

/**
 * Get top N reviewer recommendations
 */
export async function getTopReviewerRecommendations(
  submission: SubmissionData,
  reviewers: ReviewerExpertise[],
  topN: number = 5
): Promise<ReviewerMatchResult[]> {
  const matches = await matchReviewersWithSubmission(submission, reviewers)
  return matches.slice(0, topN)
}
