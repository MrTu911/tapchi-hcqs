import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/copyediting/history/[articleId]
 * Lấy lịch sử biên tập của một bài viết
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kiểm tra article tồn tại
    const article = await prisma.article.findUnique({
      where: { id: params.articleId },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            createdBy: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Kiểm tra quyền truy cập
    const isAuthor = article.submission.createdBy === session.uid;
    const isEditor = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role);

    if (!isAuthor && !isEditor) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - you do not have access to this article' },
        { status: 403 }
      );
    }

    // Lấy toàn bộ lịch sử copyedit
    const history = await prisma.copyedit.findMany({
      where: { articleId: params.articleId },
      include: {
        editor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        version: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.submission.title,
        },
        history,
      },
    });
  } catch (error: any) {
    console.error('GET /api/copyediting/history/[articleId] error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
