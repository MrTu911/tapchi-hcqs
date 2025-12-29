export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

interface WorkflowStep {
  step: string
  label: string
  status: 'completed' | 'current' | 'pending'
  date?: Date
  description?: string
  details?: any
}

/**
 * GET /api/submissions/[id]/status
 * Trả về pipeline status chi tiết của bài viết
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        category: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
    }

    // Get author info
    const author = await prisma.user.findUnique({
      where: { id: submission.createdBy },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    })

    // Get reviews
    const reviews = await prisma.review.findMany({
      where: { submissionId: params.id },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        invitedAt: 'asc'
      }
    })

    // Get files
    const files = await prisma.uploadedFile.findMany({
      where: { submissionId: params.id },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check access permission
    const isAuthor = submission.createdBy === session.uid
    const isEditor = can.review(session.role as any) || false
    const isReviewer = reviews.some(r => r.reviewerId === session.uid)

    if (!isAuthor && !isEditor && !isReviewer) {
      return NextResponse.json({ error: 'Không có quyền xem' }, { status: 403 })
    }

    // Build workflow pipeline
    const pipeline: WorkflowStep[] = []

    // Step 1: Submitted
    pipeline.push({
      step: 'SUBMITTED',
      label: 'Đã nộp bài',
      status: 'completed',
      date: submission.createdAt,
      description: `Bài viết đã được nộp với mã ${submission.code}`,
      details: {
        author: author?.fullName || 'Unknown',
        category: submission.category?.name
      }
    })

    // Step 2: Under Review
    const hasReviews = reviews.length > 0
    const allReviewsCompleted = reviews.every(r => r.submittedAt !== null)
    
    pipeline.push({
      step: 'UNDER_REVIEW',
      label: 'Đang phản biện',
      status: hasReviews 
        ? (allReviewsCompleted ? 'completed' : 'current')
        : (submission.status === 'NEW' ? 'pending' : 'current'),
      date: hasReviews ? reviews[0].invitedAt : undefined,
      description: hasReviews 
        ? `${reviews.filter(r => r.submittedAt).length}/${reviews.length} phản biện đã hoàn thành`
        : 'Chờ phân công phản biện viên',
      details: {
        reviewers: reviews.map(r => ({
          name: isEditor ? r.reviewer.fullName : 'Ẩn danh',
          status: r.submittedAt ? 'Đã hoàn thành' : 'Đang phản biện',
          submittedAt: r.submittedAt,
          recommendation: isEditor || isAuthor ? r.recommendation : undefined
        }))
      }
    })

    // Step 3: Editor Decision
    const hasDecision = ['ACCEPTED', 'REJECTED'].includes(submission.status)
    
    pipeline.push({
      step: 'EDITOR_DECISION',
      label: 'Quyết định biên tập',
      status: hasDecision ? 'completed' : (allReviewsCompleted ? 'current' : 'pending'),
      date: hasDecision ? submission.lastStatusChangeAt : undefined,
      description: hasDecision
        ? getStatusLabel(submission.status)
        : 'Chờ biên tập viên xem xét',
      details: {
        status: submission.status
      }
    })

    // Step 4: Revision (if needed)
    const needsRevision = submission.status === 'REVISION'
    const revisionCompleted = submission.status === 'UNDER_REVIEW' && reviews.length > 1
    
    if (needsRevision || revisionCompleted) {
      pipeline.push({
        step: 'REVISION',
        label: 'Chỉnh sửa bài viết',
        status: revisionCompleted ? 'completed' : 'current',
        description: revisionCompleted 
          ? 'Tác giả đã nộp bản chỉnh sửa'
          : 'Yêu cầu chỉnh sửa',
        details: {
          revisionType: submission.status,
          files: files.length
        }
      })
    }

    // Step 5: Accepted/Published
    const isAccepted = submission.status === 'ACCEPTED'
    const isPublished = submission.status === 'PUBLISHED'
    
    pipeline.push({
      step: 'PUBLISHED',
      label: isPublished ? 'Đã xuất bản' : 'Chấp nhận xuất bản',
      status: isPublished ? 'completed' : (isAccepted ? 'current' : 'pending'),
      date: undefined,  // Will be set when published
      description: isPublished
        ? 'Bài viết đã được xuất bản'
        : isAccepted
          ? 'Bài viết đã được chấp nhận, chờ xuất bản'
          : 'Chờ hoàn tất quy trình',
      details: undefined
    })

    return NextResponse.json({
      success: true,
      data: {
        submission: {
          id: submission.id,
          code: submission.code,
          title: submission.title,
          status: submission.status,
          currentStep: pipeline.find(p => p.status === 'current')?.step || 'SUBMITTED'
        },
        pipeline,
        metadata: {
          createdAt: submission.createdAt,
          updatedAt: submission.lastStatusChangeAt,
          totalReviews: reviews.length,
          completedReviews: reviews.filter(r => r.submittedAt).length,
          totalFiles: files.length
        }
      }
    })
  } catch (error) {
    logger.error({ message: 'Error fetching submission status:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy trạng thái bài viết' },
      { status: 500 }
    )
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'NEW': 'Mới nộp',
    'UNDER_REVIEW': 'Đang phản biện',
    'REVIEWED': 'Đã phản biện',
    'MINOR_REVISION': 'Yêu cầu sửa nhỏ',
    'MAJOR_REVISION': 'Yêu cầu sửa lớn',
    'REVISED': 'Đã chỉnh sửa',
    'ACCEPTED': 'Chấp nhận',
    'REJECTED': 'Từ chối',
    'PUBLISHED': 'Đã xuất bản'
  }
  return labels[status] || status
}
