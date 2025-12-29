import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * API để gắn nhiều bài báo vào một số tạp chí
 * POST /api/issues/add-articles
 * Body: { issueId: string, articleIds: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Chỉ EIC, MANAGING_EDITOR, SYSADMIN mới được phép
    const allowedRoles = ['EIC', 'MANAGING_EDITOR', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện', 403);
    }

    const { issueId, articleIds } = await req.json();

    // Validation
    if (!issueId || !Array.isArray(articleIds) || articleIds.length === 0) {
      return errorResponse('issueId và articleIds là bắt buộc', 400);
    }

    // Kiểm tra Issue tồn tại
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { volume: true },
    });

    if (!issue) {
      return errorResponse('Không tìm thấy số tạp chí', 404);
    }

    // Kiểm tra các Article tồn tại và đủ điều kiện (ACCEPTED/IN_PRODUCTION)
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
      },
      include: {
        submission: true,
      },
    });

    if (articles.length !== articleIds.length) {
      return errorResponse('Một số bài báo không tồn tại', 400);
    }

    // Kiểm tra trạng thái submission
    const validStatuses = ['ACCEPTED', 'IN_PRODUCTION', 'PUBLISHED'];
    const invalidArticles = articles.filter(
      (art) => !validStatuses.includes(art.submission.status)
    );

    if (invalidArticles.length > 0) {
      return errorResponse(
        `Một số bài báo chưa được chấp nhận: ${invalidArticles.map((a) => a.submission.title).join(', ')}`,
        400
      );
    }

    // Gắn các bài báo vào Issue
    const result = await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: { issueId: issueId },
    });

    // Cập nhật trạng thái submission sang IN_PRODUCTION (nếu chưa là PUBLISHED)
    await prisma.submission.updateMany({
      where: {
        id: { in: articles.map((a) => a.submissionId) },
        status: { not: 'PUBLISHED' },
      },
      data: { status: 'IN_PRODUCTION' },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'ARTICLE_ADDED_TO_ISSUE',
      object: 'Issue',
      after: {
        issueId,
        issueTitle: issue.title,
        volumeNo: issue.volume.volumeNo,
        issueNumber: issue.number,
        articleIds: articleIds,
        articleCount: articleIds.length,
      },
    });

    // Lấy thông tin Issue cập nhật với số lượng bài báo
    const updatedIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        volume: true,
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Đã gắn ${result.count} bài báo vào số ${issue.volume.volumeNo}.${issue.number}`,
        data: {
          issue: updatedIssue,
          addedCount: result.count,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding articles to issue:', error);
    return errorResponse('Lỗi khi gắn bài báo vào số', 500);
  }
}
