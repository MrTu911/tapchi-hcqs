/**
 * @fileoverview API route for managing submission versions
 * @description Provides version history and comparison for submissions
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/submissions/[id]/versions
 * Get all versions of a submission
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    // Get submission with all versions
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        versions: {
          orderBy: {
            versionNo: 'desc'
          },
          include: {
            submission: {
              select: {
                title: true,
                abstractVn: true,
                abstractEn: true,
                keywords: true
              }
            }
          }
        },
        files: {
          where: {
            fileType: 'MANUSCRIPT'
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            originalName: true,
            fileType: true,
            cloudStoragePath: true,
            createdAt: true
          }
        }
      }
    });

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    // Check permissions
    const userRole = session.role;
    const isAuthor = submission.createdBy === session.uid;
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole);
    const isReviewer = await prisma.review.findFirst({
      where: {
        submissionId: id,
        reviewerId: session.uid
      }
    });

    if (!isAuthor && !isEditor && !isReviewer) {
      return errorResponse('Access denied', 403);
    }

    return successResponse({
      submission: {
        id: submission.id,
        code: submission.code,
        title: submission.title,
        status: submission.status,
        author: submission.author
      },
      versions: submission.versions,
      files: submission.files,
      currentVersion: {
        title: submission.title,
        abstractVn: submission.abstractVn,
        abstractEn: submission.abstractEn,
        keywords: submission.keywords,
        updatedAt: submission.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching submission versions:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * POST /api/submissions/[id]/versions
 * Create a new version of a submission (for revision)
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;
    const body = await request.json();
    const { filesetId, changelog, title, abstractVn, abstractEn, keywords } = body;

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: {
            versionNo: 'desc'
          },
          take: 1
        }
      }
    });

    if (!submission) {
      return errorResponse('Submission not found', 404);
    }

    // Check if user is the author
    if (submission.createdBy !== session.uid) {
      return errorResponse('Only the author can submit revisions', 403);
    }

    // Check if submission is in REVISION status
    if (submission.status !== 'REVISION') {
      return errorResponse('Submission is not in revision status', 400);
    }

    // Calculate new version number
    const lastVersion = submission.versions[0];
    const newVersionNo = lastVersion ? lastVersion.versionNo + 1 : 1;

    // Create new version record
    const newVersion = await prisma.submissionVersion.create({
      data: {
        submissionId: id,
        versionNo: newVersionNo,
        filesetId: filesetId || `v${newVersionNo}`,
        changelog: changelog || 'Revision submitted'
      }
    });

    // Update submission if new content provided
    if (title || abstractVn || abstractEn || keywords) {
      await prisma.submission.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(abstractVn && { abstractVn }),
          ...(abstractEn && { abstractEn }),
          ...(keywords && { keywords })
        }
      });
    }

    // Mark revision deadline as completed
    await prisma.deadline.updateMany({
      where: {
        submissionId: id,
        type: 'REVISION_SUBMIT',
        completedAt: null
      },
      data: {
        completedAt: new Date()
      }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'SUBMISSION_VERSION_CREATED',
      object: `SUBMISSION:${id}`,
      after: {
        versionNo: newVersionNo,
        changelog
      }
    });

    return successResponse({
      message: 'Revision submitted successfully',
      version: newVersion
    });

  } catch (error: any) {
    console.error('Error creating submission version:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
