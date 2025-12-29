/**
 * @fileoverview API route for assigning submissions to editors
 * @description Allows Managing Editor to assign submissions to Section Editors
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
// authOptions not needed
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';

/**
 * POST /api/managing-editor/assign
 * Assign a submission to an editor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const userRole = session.role;
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];

    if (!allowedRoles.includes(userRole)) {
      return errorResponse('Access denied', 403);
    }

    const body = await request.json();
    const { submissionId, editorId, note } = body;

    if (!submissionId || !editorId) {
      return errorResponse('Missing required fields', 400);
    }

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    // Verify editor exists and has appropriate role
    const editor = await prisma.user.findUnique({
      where: { id: editorId }
    });

    if (!editor) {
      return errorResponse('Editor not found', 404);
    }

    const editorRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC'];
    if (!editorRoles.includes(editor.role)) {
      return errorResponse('User is not an editor', 400);
    }

    // Create deadline for editor assignment (7 days default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const deadline = await prisma.deadline.create({
      data: {
        submissionId,
        assignedTo: editorId,
        type: 'EDITOR_DECISION',
        dueDate,
        note: note || `Assigned by ${session.fullName || session.email}`
      }
    });

    // Log audit trail
    await logAudit({
      actorId: session.uid,
      action: 'SUBMISSION_ASSIGNED',
      object: `SUBMISSION:${submissionId}`,
      after: {
        assignedTo: editorId,
        assignedBy: session.uid,
        note,
        deadlineId: deadline.id
      }
    });

    return successResponse({
      message: 'Submission assigned successfully',
      deadline
    });

  } catch (error: any) {
    console.error('Error assigning submission:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * GET /api/managing-editor/assign
 * Get list of available editors for assignment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const userRole = session.role;
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];

    if (!allowedRoles.includes(userRole)) {
      return errorResponse('Access denied', 403);
    }

    // Get all active editors
    const editors = await prisma.user.findMany({
      where: {
        role: {
          in: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC']
        },
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true,
        academicTitle: true,
        position: true,
        _count: {
          select: {
            assignedDeadlines: {
              where: {
                completedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    const editorsWithWorkload = editors.map(editor => ({
      id: editor.id,
      fullName: editor.fullName,
      email: editor.email,
      role: editor.role,
      org: editor.org,
      academicTitle: editor.academicTitle,
      position: editor.position,
      currentWorkload: editor._count.assignedDeadlines
    }));

    return successResponse(editorsWithWorkload);

  } catch (error: any) {
    console.error('Error fetching editors:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
