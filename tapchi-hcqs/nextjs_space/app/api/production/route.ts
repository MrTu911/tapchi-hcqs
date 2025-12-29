import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod validation schema
const createProductionSchema = z.object({
  articleId: z.string().uuid(),
  layoutUrl: z.string().url(),
  doi: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/production
 * Lấy danh sách bài sẵn sàng xuất bản
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ cho phép managing editor, EIC, sysadmin xem
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const productions = await prisma.production.findMany({
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    org: true,
                  },
                },
                category: true,
              },
            },
          },
        },
        issue: {
          include: {
            volume: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: productions,
    });
  } catch (error: any) {
    console.error('GET /api/production error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/production
 * Tạo production record mới
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ cho phép managing editor, EIC, sysadmin tạo
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createProductionSchema.parse(body);

    // Kiểm tra xem article có tồn tại không
    const article = await prisma.article.findUnique({
      where: { id: validated.articleId },
      include: {
        submission: true,
        production: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Kiểm tra xem đã có production record chưa
    if (article.production) {
      return NextResponse.json(
        { success: false, message: 'Production record already exists for this article' },
        { status: 400 }
      );
    }

    // Tạo production record
    const production = await prisma.production.create({
      data: {
        articleId: validated.articleId,
        layoutUrl: validated.layoutUrl,
        doi: validated.doi,
        notes: validated.notes,
      },
      include: {
        article: {
          include: {
            submission: true,
          },
        },
      },
    });

    // Cập nhật trạng thái bài viết sang IN_PRODUCTION
    await prisma.submission.update({
      where: { id: article.submissionId },
      data: { status: 'IN_PRODUCTION' },
    });

    // Ghi lại vào status history
    await prisma.articleStatusHistory.create({
      data: {
        articleId: validated.articleId,
        status: 'IN_PRODUCTION',
        changedBy: session.uid,
        notes: 'Article moved to production phase',
      },
    });

    // Gửi notification cho tác giả
    await prisma.notification.create({
      data: {
        userId: article.submission.createdBy,
        type: 'ARTICLE_PUBLISHED',
        title: 'Bài viết chuyển sang giai đoạn sản xuất',
        message: `Bài viết "${article.submission.title}" đang trong giai đoạn dàn trang và chuẩn bị xuất bản.`,
        link: `/dashboard/author/submissions/${article.submissionId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Production record created successfully',
      data: production,
    });
  } catch (error: any) {
    console.error('POST /api/production error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
