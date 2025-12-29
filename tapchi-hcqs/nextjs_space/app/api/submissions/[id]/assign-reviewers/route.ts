export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

interface RouteContext {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession()
    
    if (!session || !can.assignReview(session.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền gán phản biện' },
        { status: 403 }
      )
    }

    const { id } = context.params
    const body = await request.json()
    const { reviewerIds } = body

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length < 2) {
      return NextResponse.json(
        { error: 'Cần chọn ít nhất 2 phản biện viên' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        reviews: true
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài nộp' },
        { status: 404 }
      )
    }

    // Determine the current round
    const maxRound = submission.reviews.length > 0 
      ? Math.max(...submission.reviews.map(r => r.roundNo))
      : 0
    const currentRound = maxRound + 1

    // Get existing reviewer IDs for this round
    const existingReviewerIds = submission.reviews
      .filter(r => r.roundNo === currentRound)
      .map(r => r.reviewerId)

    // Determine reviewers to add and remove
    const reviewersToAdd = reviewerIds.filter((id: string) => !existingReviewerIds.includes(id))
    const reviewersToRemove = existingReviewerIds.filter(id => !reviewerIds.includes(id))

    // Remove reviews that are no longer needed
    if (reviewersToRemove.length > 0) {
      await prisma.review.deleteMany({
        where: {
          submissionId: id,
          roundNo: currentRound,
          reviewerId: {
            in: reviewersToRemove
          },
          submittedAt: null // Only remove pending reviews
        }
      })
    }

    // Create new reviews
    if (reviewersToAdd.length > 0) {
      await prisma.review.createMany({
        data: reviewersToAdd.map((reviewerId: string) => ({
          submissionId: id,
          reviewerId,
          roundNo: currentRound
        }))
      })
    }

    // Update submission status to UNDER_REVIEW if it was NEW
    if (submission.status === 'NEW') {
      await prisma.submission.update({
        where: { id },
        data: {
          status: 'UNDER_REVIEW'
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'ASSIGN_REVIEWERS',
        object: `submission:${id}`,
        after: { reviewerIds, round: currentRound } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Get updated reviews
    const updatedReviews = await prisma.review.findMany({
      where: {
        submissionId: id,
        roundNo: currentRound
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      reviews: updatedReviews,
      message: 'Gán phản biện viên thành công'
    })
  } catch (error) {
    logger.error({ message: 'Error assigning reviewers:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi gán phản biện' },
      { status: 500 }
    )
  }
}
