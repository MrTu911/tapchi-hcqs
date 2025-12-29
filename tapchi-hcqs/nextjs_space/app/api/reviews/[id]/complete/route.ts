
export const dynamic = "force-dynamic"

/**
 * POST /api/reviews/[id]/complete
 * Mô tả: Đánh dấu review hoàn thành và trigger workflow
 * Auth: Required (Reviewer)
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-guards';
import { prisma } from '@/lib/prisma';
import { updateReviewerStatistics } from '@/lib/reviewer-matcher';
import { triggerWorkflowEvent } from '@/lib/workflow-automator';
import { successResponse } from '@/lib/responses';
import { handleError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log request
    logger.info({
      context: 'API_REVIEW_COMPLETE',
      message: 'Mark review as complete',
      reviewId: params.id
    });

    const session = await requireAuth(request);
    
    const reviewId = params.id;
    
    // Get review with submission
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        submission: {
          include: {
            author: true
          }
        },
        reviewer: true
      }
    });
    
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    
    // Verify reviewer owns this review
    if (review.reviewerId !== session.user.id) {
      throw new AuthorizationError('Forbidden: Bạn không có quyền hoàn thành review này');
    }
    
    // Update reviewer statistics
    await updateReviewerStatistics(review.reviewerId);
    
    // Get submission editors
    const editors = await prisma.user.findMany({
      where: {
        role: { in: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC'] }
      }
    });
    
    // Notify editors
    for (const editor of editors) {
      await triggerWorkflowEvent('REVIEW_COMPLETED', {
        recipientEmail: editor.email,
        recipientName: editor.fullName,
        submissionCode: review.submission.code,
        submissionTitle: review.submission.title
      });
    }
    
    // Log success
    logger.info({
      context: 'API_REVIEW_COMPLETE',
      message: 'Review completed successfully',
      reviewId: params.id,
      userId: session.user.id
    });

    return successResponse({
      message: 'Review completed and notifications sent'
    });
    
  } catch (error) {
    logger.error({
      context: 'API_REVIEW_COMPLETE',
      message: 'Complete review failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_REVIEW_COMPLETE');
  }
}
