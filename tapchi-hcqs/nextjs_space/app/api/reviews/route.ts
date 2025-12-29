export const dynamic = "force-dynamic"

/**
 * POST /api/reviews
 * Mô tả: Tạo review assignment mới
 * Auth: Required (Editor, Admin)
 * 
 * GET /api/reviews
 * Mô tả: Lấy danh sách reviews
 * Auth: Required (Reviewer, Editor, Admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-guards'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { handleError, AuthorizationError, ValidationError, NotFoundError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_REVIEWS_CREATE',
      message: 'Create review assignment'
    });

    const session = await requireAuth(request)
    
    if (!can.assignReview(session.user.role as any)) {
      throw new AuthorizationError('Không có quyền gán phản biện')
    }

    const body = await request.json()
    const { submissionId, reviewerId, roundNo } = body

    if (!submissionId || !reviewerId || !roundNo) {
      throw new ValidationError('Thiếu thông tin bắt buộc: submissionId, reviewerId, roundNo')
    }

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      throw new NotFoundError('Không tìm thấy bài nộp')
    }

    // Check if reviewer exists and has reviewer role
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId }
    })

    if (!reviewer || !can.review(reviewer.role as any)) {
      throw new ValidationError('Người được chọn không có quyền phản biện')
    }

    // Create review assignment
    const review = await prisma.review.create({
      data: {
        submissionId,
        reviewerId,
        roundNo
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        submission: {
          select: {
            id: true,
            code: true,
            title: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'ASSIGN_REVIEW',
        object: `review:${review.id}`,
        after: review as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Log success
    logger.info({
      context: 'API_REVIEWS_CREATE',
      message: 'Review assignment created',
      reviewId: review.id,
      userId: session.user.id
    });

    return NextResponse.json(review)
  } catch (error) {
    logger.error({
      context: 'API_REVIEWS_CREATE',
      message: 'Create review assignment failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_REVIEWS_CREATE')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_REVIEWS_GET',
      message: 'Get reviews list'
    });

    const session = await requireAuth(request)

    const searchParams = request.nextUrl.searchParams
    const submissionId = searchParams.get('submissionId')
    const reviewerId = searchParams.get('reviewerId')

    const where: any = {}

    if (submissionId) {
      where.submissionId = submissionId
    }

    if (reviewerId) {
      where.reviewerId = reviewerId
    } else if (session.user.role === 'REVIEWER') {
      // If user is a reviewer, only show their reviews
      where.reviewerId = session.user.id
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        submission: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Log success
    logger.info({
      context: 'API_REVIEWS_GET',
      message: 'Reviews list retrieved',
      count: reviews.length,
      userId: session.user.id
    });

    return NextResponse.json(reviews)
  } catch (error) {
    logger.error({
      context: 'API_REVIEWS_GET',
      message: 'Get reviews list failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_REVIEWS_GET')
  }
}
