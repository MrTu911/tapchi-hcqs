
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';
import { getSignedImageUrl } from '@/lib/image-utils';

/**
 * GET /api/news/[id] - Lấy chi tiết tin tức
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            org: true
          }
        }
      }
    });

    if (!news) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    // Tăng views nếu tin đã publish
    if (news.isPublished) {
      await prisma.news.update({
        where: { id: params.id },
        data: { views: { increment: 1 } }
      });
    }

    // Add signed URL for cover image
    const newsWithSignedUrl = {
      ...news,
      coverImageSigned: news.coverImage 
        ? await getSignedImageUrl(news.coverImage, 86400) 
        : null
    };

    return successResponse({ news: newsWithSignedUrl });
  } catch (error: any) {
    return errorResponse('Lỗi khi lấy tin tức', 500, error.message);
  }
}

/**
 * PUT /api/news/[id] - Cập nhật tin tức (chỉ admin/editor hoặc author)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!existingNews) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    // Kiểm tra quyền: admin/editor hoặc tác giả
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    const isEditor = allowedRoles.includes(session.role);
    const isAuthor = existingNews.authorId === session.uid;

    if (!isEditor && !isAuthor) {
      return errorResponse('Không có quyền chỉnh sửa tin tức này', 403);
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      summary,
      summaryEn,
      content,
      contentEn,
      coverImage,
      category,
      tags,
      isPublished,
      isFeatured,
      publishedAt
    } = body;

    // Update slug nếu title thay đổi
    let slug = existingNews.slug;
    if (title && title !== existingNews.title) {
      slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);

      // Kiểm tra slug trùng (trừ chính nó)
      let finalSlug = slug;
      let counter = 1;
      while (true) {
        const existing = await prisma.news.findUnique({ where: { slug: finalSlug } });
        if (!existing || existing.id === params.id) break;
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = finalSlug;
    }

    const updatedNews = await prisma.news.update({
      where: { id: params.id },
      data: {
        slug,
        title: title || existingNews.title,
        titleEn: titleEn !== undefined ? titleEn : existingNews.titleEn,
        summary: summary !== undefined ? summary : existingNews.summary,
        summaryEn: summaryEn !== undefined ? summaryEn : existingNews.summaryEn,
        content: content || existingNews.content,
        contentEn: contentEn !== undefined ? contentEn : existingNews.contentEn,
        coverImage: coverImage !== undefined ? coverImage : existingNews.coverImage,
        category: category !== undefined ? category : existingNews.category,
        tags: tags !== undefined ? tags : existingNews.tags,
        isPublished: isPublished !== undefined ? isPublished : existingNews.isPublished,
        isFeatured: isFeatured !== undefined ? isFeatured : existingNews.isFeatured,
        publishedAt: publishedAt !== undefined 
          ? (publishedAt ? new Date(publishedAt) : null)
          : existingNews.publishedAt,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            org: true
          }
        }
      }
    });

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: 'NEWS_UPDATED',
      object: `News:${updatedNews.id}`,
      after: { title: updatedNews.title },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return successResponse({ news: updatedNews });
  } catch (error: any) {
    return errorResponse('Lỗi khi cập nhật tin tức', 500, error.message);
  }
}

/**
 * DELETE /api/news/[id] - Xóa tin tức (chỉ admin/editor)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    // Chỉ admin/editor mới được xóa
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền xóa tin tức', 403);
    }

    const existingNews = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!existingNews) {
      return errorResponse('Không tìm thấy tin tức', 404);
    }

    await prisma.news.delete({
      where: { id: params.id }
    });

    // Audit log
    await logAudit({
      actorId: session.uid,
      action: 'NEWS_DELETED',
      object: `News:${params.id}`,
      after: { title: existingNews.title, category: existingNews.category },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return successResponse({ message: 'Đã xóa tin tức thành công' });
  } catch (error: any) {
    return errorResponse('Lỗi khi xóa tin tức', 500, error.message);
  }
}
