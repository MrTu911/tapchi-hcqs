export const dynamic = "force-dynamic"

/**
 * GET /api/submissions/[id]
 * Mô tả: Lấy chi tiết bài nộp
 * Auth: Required (Author, Editor, Reviewer assigned)
 * 
 * PATCH /api/submissions/[id]
 * Mô tả: Cập nhật thông tin bài nộp
 * Auth: Required (Author, Editor)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-guards'
import { handleError, NotFoundError, AuthorizationError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log request
    logger.info({
      context: 'API_SUBMISSION_DETAIL',
      message: 'Get submission detail',
      submissionId: params.id
    });

    const session = await requireAuth(request)

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            org: true
          }
        },
        versions: {
          orderBy: {
            versionNo: 'desc'
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        decisions: {
          include: {
            editor: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            decidedAt: 'desc'
          }
        },
        article: {
          include: {
            issue: true
          }
        }
      }
    })

    if (!submission) {
      throw new NotFoundError('Không tìm thấy bài nộp')
    }

    // Check permissions
    const isAuthor = submission.createdBy === session.user.id
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.user.role)
    const isReviewer = submission.reviews.some(r => r.reviewerId === session.user.id)

    if (!isAuthor && !isEditor && !isReviewer) {
      throw new AuthorizationError('Không có quyền xem bài nộp này')
    }

    // Log success
    logger.info({
      context: 'API_SUBMISSION_DETAIL',
      message: 'Submission detail retrieved',
      submissionId: params.id,
      userId: session.user.id
    });

    return NextResponse.json(submission)
  } catch (error) {
    logger.error({
      context: 'API_SUBMISSION_DETAIL',
      message: 'Get submission detail failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_SUBMISSION_DETAIL')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Log request
    logger.info({
      context: 'API_SUBMISSION_UPDATE',
      message: 'Update submission',
      submissionId: params.id
    });

    const session = await requireAuth(request)

    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    })

    if (!submission) {
      throw new NotFoundError('Không tìm thấy bài nộp')
    }

    // Check permissions
    const isAuthor = submission.createdBy === session.user.id
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.user.role)

    if (!isAuthor && !isEditor) {
      throw new AuthorizationError('Không có quyền chỉnh sửa bài nộp này')
    }

    const body = await request.json()
    const { status, categoryId, securityLevel, ...otherData } = body

    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        ...(securityLevel && { securityLevel }),
        ...otherData
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'UPDATE_SUBMISSION',
        object: `submission:${submission.id}`,
        before: submission as any,
        after: updatedSubmission as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    // Log success
    logger.info({
      context: 'API_SUBMISSION_UPDATE',
      message: 'Submission updated successfully',
      submissionId: params.id,
      userId: session.user.id
    });

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    logger.error({
      context: 'API_SUBMISSION_UPDATE',
      message: 'Update submission failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_SUBMISSION_UPDATE')
  }
}
