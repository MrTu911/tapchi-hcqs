
/**
 * API: Auto-assign reviewers
 * POST /api/workflow/auto-assign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/responses';
import { suggestReviewers } from '@/lib/reviewer-matcher';
import { triggerWorkflowEvent } from '@/lib/workflow-automator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { submissionId, limit = 5, autoAssign = false } = body;

    if (!submissionId) {
      return errorResponse('submissionId is required', 400);
    }

    // Get reviewer suggestions
    const suggestions = await suggestReviewers(submissionId, { limit });

    // If auto-assign is true, create review invitations
    if (autoAssign && suggestions.length > 0) {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId }
      });

      if (!submission) {
        return errorResponse('Submission not found', 404);
      }

      // Auto-assign top 2-3 reviewers
      const topReviewers = suggestions.slice(0, Math.min(3, suggestions.length));

      for (const reviewer of topReviewers) {
        // Create review record
        const reviewDeadline = new Date();
        reviewDeadline.setDate(reviewDeadline.getDate() + 21); // 21 days

        await prisma.review.create({
          data: {
            submissionId,
            reviewerId: reviewer.userId,
            roundNo: 1,
            deadline: reviewDeadline,
            invitedAt: new Date()
          }
        });

        // Send invitation email
        await triggerWorkflowEvent('REVIEWER_INVITED', {
          recipientEmail: reviewer.email,
          recipientName: reviewer.name,
          submissionCode: submission.code,
          submissionTitle: submission.title
        });
      }

      return successResponse({
        message: `Auto-assigned ${topReviewers.length} reviewers`,
        suggestions,
        assigned: topReviewers
      });
    }

    return successResponse({
      suggestions
    });

  } catch (error: any) {
    console.error('❌ Error in auto-assign API:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
