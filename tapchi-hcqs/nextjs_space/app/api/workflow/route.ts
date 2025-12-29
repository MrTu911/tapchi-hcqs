/**
 * @fileoverview API route for managing submission workflow transitions
 * @description Handles status changes and workflow actions for submissions
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';
import { SubmissionStatus } from '@prisma/client';

/**
 * POST /api/workflow
 * Execute a workflow action on a submission
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { submissionId, action, newStatus, note } = body;

    if (!submissionId || !action || !newStatus) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    });

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    // Check permissions
    const userRole = session.role;
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole);
    const isManaging = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole);
    const isEIC = ['EIC', 'SYSADMIN'].includes(userRole);

    // Validate action permissions
    const currentStatus = submission.status;
    let authorized = false;

    switch (action) {
      case 'send_to_review':
        authorized = isEditor && (currentStatus === 'NEW' || currentStatus === 'REVISION');
        break;
      case 'desk_reject':
        authorized = isEditor && currentStatus === 'NEW';
        break;
      case 'request_revision':
        authorized = isEditor && currentStatus === 'UNDER_REVIEW';
        break;
      case 'accept':
        authorized = isManaging && currentStatus === 'UNDER_REVIEW';
        break;
      case 'reject':
        authorized = isEditor && (currentStatus === 'UNDER_REVIEW' || currentStatus === 'REVISION');
        break;
      case 'start_production':
        authorized = isManaging && currentStatus === 'ACCEPTED';
        break;
      case 'publish':
        authorized = isEIC && currentStatus === 'IN_PRODUCTION';
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    if (!authorized) {
      return errorResponse('You do not have permission to perform this action', 403);
    }

    // Update submission status
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus as SubmissionStatus
      }
    });

    // Create editor decision record if applicable
    if (['accept', 'reject', 'request_revision'].includes(action)) {
      await prisma.editorDecision.create({
        data: {
          submissionId,
          decidedBy: session.uid,
          decision: action === 'accept' ? 'ACCEPT' : action === 'reject' ? 'REJECT' : 'MAJOR',
          note: note || '',
          roundNo: 1 // Default round number
        }
      });
    }

    // Create deadline for revision if applicable
    if (action === 'request_revision') {
      const revisionDeadline = new Date();
      revisionDeadline.setDate(revisionDeadline.getDate() + 14); // 14 days for revision

      await prisma.deadline.create({
        data: {
          submissionId,
          assignedTo: submission.createdBy,
          type: 'REVISION_SUBMIT',
          dueDate: revisionDeadline,
          note: note || 'Please submit revised version'
        }
      });
    }

    // Log audit trail
    const auditActionMap: { [key: string]: string } = {
      'send_to_review': 'SUBMISSION_SENT_TO_REVIEW',
      'desk_reject': 'SUBMISSION_DESK_REJECTED',
      'request_revision': 'REVISION_REQUESTED',
      'accept': 'SUBMISSION_ACCEPTED',
      'reject': 'SUBMISSION_REJECTED',
      'start_production': 'PRODUCTION_STARTED',
      'publish': 'ARTICLE_PUBLISHED'
    };

    await logAudit({
      actorId: session.uid,
      action: auditActionMap[action] || 'SUBMISSION_STATUS_CHANGE',
      object: `SUBMISSION:${submissionId}`,
      before: { status: currentStatus },
      after: {
        status: newStatus,
        note
      }
    });

    // TODO: Send email notification to author/reviewers
    // This should be implemented with email service integration

    return successResponse({
      message: 'Workflow action executed successfully',
      submission: updatedSubmission
    });

  } catch (error: any) {
    console.error('Error executing workflow action:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
