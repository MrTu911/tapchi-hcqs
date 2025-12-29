import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

// GET - Lấy danh sách bài viết nổi bật
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const whereClause: any = {};
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const featuredArticles = await prisma.featuredArticle.findMany({
      where: whereClause,
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    fullName: true,
                    org: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            issue: {
              include: {
                volume: true,
              },
            },
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: featuredArticles,
    });
  } catch (error: any) {
    console.error('Error fetching featured articles:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Thêm bài viết nổi bật
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ admin và editor được thêm
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, reason, position } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra article có tồn tại và đã xuất bản
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        submission: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Bài viết không tồn tại' },
        { status: 404 }
      );
    }

    if (article.submission.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Chỉ có thể đánh dấu nổi bật bài đã xuất bản' },
        { status: 400 }
      );
    }

    // Kiểm tra xem bài đã được featured chưa
    const existing = await prisma.featuredArticle.findUnique({
      where: { articleId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bài viết này đã được đánh dấu nổi bật' },
        { status: 400 }
      );
    }

    // Tạo featured article
    const featured = await prisma.featuredArticle.create({
      data: {
        articleId,
        reason: reason || null,
        position: position || 0,
        isActive: true,
      },
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ARTICLE_UPDATED,
      object: `FEATURED_ARTICLE:${featured.id}`,
      after: { articleId, reason, position },
    });

    return NextResponse.json({
      success: true,
      data: featured,
      message: 'Bài viết đã được thêm vào danh sách nổi bật',
    });
  } catch (error: any) {
    console.error('Error creating featured article:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Xóa bài viết nổi bật
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ admin và editor được xóa
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID bài viết nổi bật' },
        { status: 400 }
      );
    }

    const featured = await prisma.featuredArticle.findUnique({
      where: { id },
      include: {
        article: true,
      },
    });

    if (!featured) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài viết nổi bật' },
        { status: 404 }
      );
    }

    await prisma.featuredArticle.delete({
      where: { id },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ARTICLE_UPDATED,
      object: `FEATURED_ARTICLE:${id}`,
      before: { articleId: featured.articleId, isActive: featured.isActive },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bài viết khỏi danh sách nổi bật',
    });
  } catch (error: any) {
    console.error('Error deleting featured article:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
