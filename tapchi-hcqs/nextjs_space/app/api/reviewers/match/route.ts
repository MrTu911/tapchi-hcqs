
/**
 * AI Reviewer Matching API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTopReviewerRecommendations } from '@/lib/ai/reviewer-match'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })

    if (!user || !['MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { submissionId, topN = 5 } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID required' },
        { status: 400 }
      )
    }

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Get all reviewers
    const reviewerProfiles = await prisma.reviewerProfile.findMany({
      where: { isAvailable: true },
      include: { user: true }
    })

    // Match reviewers
    const matches = await getTopReviewerRecommendations(
      {
        title: submission.title,
        abstractVn: submission.abstractVn || undefined,
        abstractEn: submission.abstractEn || undefined,
        keywords: submission.keywords,
        section: submission.section || undefined
      },
      reviewerProfiles.map(profile => ({
        reviewerId: profile.userId,
        expertise: profile.expertise,
        keywords: profile.keywords,
        previousReviews: profile.totalReviews,
        averageRating: profile.averageRating,
        isAvailable: profile.isAvailable
      })),
      topN
    )

    // Save match scores
    for (const match of matches) {
      await prisma.reviewerMatchScore.upsert({
        where: {
          submissionId_reviewerId: {
            submissionId,
            reviewerId: match.reviewerId
          }
        },
        update: {
          score: match.score,
          expertiseMatch: match.breakdown.expertiseMatch,
          keywordMatch: match.breakdown.keywordMatch,
          availabilityScore: match.breakdown.availabilityScore
        },
        create: {
          submissionId,
          reviewerId: match.reviewerId,
          score: match.score,
          expertiseMatch: match.breakdown.expertiseMatch,
          keywordMatch: match.breakdown.keywordMatch,
          availabilityScore: match.breakdown.availabilityScore
        }
      })
    }

    // Enrich with reviewer details
    const enrichedMatches = await Promise.all(
      matches.map(async match => {
        const reviewer = await prisma.user.findUnique({
          where: { id: match.reviewerId },
          include: { reviewerProfile: true }
        })
        return {
          ...match,
          reviewer
        }
      })
    )

    return NextResponse.json({ matches: enrichedMatches })
  } catch (error) {
    console.error('Reviewer matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match reviewers' },
      { status: 500 }
    )
  }
}
