
/**
 * API: Get workflow timeline for a submission
 * GET /api/workflow/timeline?submissionId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return errorResponse('submissionId is required', 400);
    }

    // Get submission with all related data
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: {
          select: {
            fullName: true,
            email: true
          }
        },
        category: true,
        versions: {
          orderBy: { createdAt: 'asc' }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { invitedAt: 'asc' }
        },
        decisions: {
          include: {
            editor: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { decidedAt: 'asc' }
        },
        deadlines: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    // Build timeline events
    const timelineEvents = [];

    // 1. Submission created
    timelineEvents.push({
      type: 'SUBMISSION_CREATED',
      timestamp: submission.createdAt,
      actor: submission.author.fullName,
      description: 'Bài viết được nộp',
      status: 'NEW'
    });

    // 2. Version updates
    submission.versions.forEach((version, index) => {
      timelineEvents.push({
        type: 'VERSION_UPDATED',
        timestamp: version.createdAt,
        actor: submission.author.fullName,
        description: `Nộp phiên bản ${version.versionNo}`,
        details: version.changelog
      });
    });

    // 3. Review invitations and completions
    submission.reviews.forEach(review => {
      timelineEvents.push({
        type: 'REVIEW_INVITED',
        timestamp: review.invitedAt,
        actor: review.reviewer.fullName,
        description: 'Mời phản biện',
        status: 'UNDER_REVIEW'
      });

      if (review.acceptedAt) {
        timelineEvents.push({
          type: 'REVIEW_ACCEPTED',
          timestamp: review.acceptedAt,
          actor: review.reviewer.fullName,
          description: 'Chấp nhận phản biện'
        });
      }

      if (review.declinedAt) {
        timelineEvents.push({
          type: 'REVIEW_DECLINED',
          timestamp: review.declinedAt,
          actor: review.reviewer.fullName,
          description: 'Từ chối phản biện'
        });
      }

      if (review.submittedAt) {
        timelineEvents.push({
          type: 'REVIEW_COMPLETED',
          timestamp: review.submittedAt,
          actor: review.reviewer.fullName,
          description: 'Hoàn thành phản biện',
          recommendation: review.recommendation
        });
      }
    });

    // 4. Editor decisions
    submission.decisions.forEach(decision => {
      timelineEvents.push({
        type: 'EDITOR_DECISION',
        timestamp: decision.decidedAt,
        actor: decision.editor.fullName,
        description: 'Quyết định biên tập',
        decision: decision.decision,
        note: decision.note
      });
    });

    // 5. Deadlines
    submission.deadlines.forEach(deadline => {
      const now = new Date();
      const isOverdue = !deadline.completedAt && new Date(deadline.dueDate) < now;
      
      timelineEvents.push({
        type: 'DEADLINE_SET',
        timestamp: deadline.createdAt,
        description: `Deadline: ${deadline.type}`,
        dueDate: deadline.dueDate,
        isOverdue: isOverdue,
        completed: deadline.completedAt
      });
    });

    // 6. Status changes (inferred from lastStatusChangeAt)
    timelineEvents.push({
      type: 'STATUS_CHANGE',
      timestamp: submission.lastStatusChangeAt,
      description: `Trạng thái hiện tại: ${submission.status}`,
      status: submission.status
    });

    // Sort timeline by timestamp
    timelineEvents.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return successResponse({
      submission: {
        id: submission.id,
        code: submission.code,
        title: submission.title,
        status: submission.status,
        createdAt: submission.createdAt,
        author: submission.author
      },
      timeline: timelineEvents,
      stats: {
        totalReviews: submission.reviews.length,
        completedReviews: submission.reviews.filter(r => r.submittedAt).length,
        totalVersions: submission.versions.length,
        totalDecisions: submission.decisions.length,
        daysInCurrentStatus: submission.daysInCurrentStatus
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching timeline:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
