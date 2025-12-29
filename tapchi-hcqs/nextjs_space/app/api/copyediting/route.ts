import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod validation schema
const createCopyeditSchema = z.object({
  articleId: z.string().uuid(),
  notes: z.string().optional(),
  fileUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  deadline: z.string().optional(), // ISO date string
});

/**
 * GET /api/copyediting
 * Lấy danh sách bài đang chờ biên tập
 * Query params: status, articleId
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const articleId = searchParams.get('articleId');

    const where: any = {};
    if (status) where.status = status;
    if (articleId) where.articleId = articleId;

    // Chỉ cho phép editor, managing editor, EIC, sysadmin xem
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const copyedits = await prisma.copyedit.findMany({
      where,
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
              },
            },
          },
        },
        editor: {
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
      data: copyedits,
    });
  } catch (error: any) {
    console.error('GET /api/copyediting error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/copyediting
 * Tạo bản biên tập mới
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

    // Chỉ cho phép editor, managing editor, EIC, sysadmin tạo
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createCopyeditSchema.parse(body);

    // Kiểm tra xem article có tồn tại không
    const article = await prisma.article.findUnique({
      where: { id: validated.articleId },
      include: {
        submission: true,
        copyedits: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Tính version mới
    const nextVersion = article.copyedits.length > 0 ? article.copyedits[0].version + 1 : 1;

    // Tạo copyedit mới
    const copyedit = await prisma.copyedit.create({
      data: {
        articleId: validated.articleId,
        editorId: session.uid,
        version: nextVersion,
        notes: validated.notes,
        fileUrl: validated.fileUrl,
        status: 'editing',
        tags: validated.tags || [],
        deadline: validated.deadline ? new Date(validated.deadline) : undefined,
      },
      include: {
        article: {
          include: {
            submission: true,
          },
        },
        editor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Tạo notification cho tác giả
    await prisma.notification.create({
      data: {
        userId: article.submission.createdBy,
        type: 'ARTICLE_PUBLISHED', // Tạm dùng type này, có thể thêm COPYEDITING_STARTED
        title: 'Bài viết của bạn đang được biên tập',
        message: `Bài viết "${article.submission.title}" đang trong quá trình biên tập nội dung.`,
        link: `/dashboard/author/submissions/${article.submissionId}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Copyedit created successfully',
      data: copyedit,
    });
  } catch (error: any) {
    console.error('POST /api/copyediting error:', error);
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
