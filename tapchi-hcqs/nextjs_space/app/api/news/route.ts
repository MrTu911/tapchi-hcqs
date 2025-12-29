
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit } from '@/lib/audit-logger';
import { getSignedImageUrl } from '@/lib/image-utils';

/**
 * GET /api/news - Lấy danh sách tin tức
 * Query params: category, isFeatured, isPublished, page, limit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isFeatured = searchParams.get('isFeatured');
    const isPublished = searchParams.get('isPublished');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (category) where.category = category;
    if (isFeatured !== null) where.isFeatured = isFeatured === 'true';
    if (isPublished !== null) where.isPublished = isPublished === 'true';

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip,
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
      }),
      prisma.news.count({ where })
    ]);

    // Add signed URLs for cover images
    const newsWithSignedUrls = await Promise.all(
      news.map(async (item) => ({
        ...item,
        coverImageSigned: item.coverImage 
          ? await getSignedImageUrl(item.coverImage, 86400) 
          : null
      }))
    );

    return successResponse({
      news: newsWithSignedUrls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return errorResponse('Lỗi khi lấy danh sách tin tức', 500, error.message);
  }
}

/**
 * POST /api/news - Tạo tin tức mới (chỉ admin/editor)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    // Kiểm tra quyền (chỉ admin, EIC, managing editor, section editor)
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền tạo tin tức', 403);
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

    // Validate required fields
    if (!title || !content) {
      return errorResponse('Thiếu tiêu đề hoặc nội dung', 400);
    }

    // Tạo slug từ title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    // Kiểm tra slug trùng
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.news.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const news = await prisma.news.create({
      data: {
        slug: finalSlug,
        title,
        titleEn: titleEn || null,
        summary: summary || null,
        summaryEn: summaryEn || null,
        content,
        contentEn: contentEn || null,
        coverImage: coverImage || null,
        category: category || null,
        tags: tags || [],
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        publishedAt: publishedAt ? new Date(publishedAt) : (isPublished ? new Date() : null),
        authorId: session.uid,
        views: 0
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
      action: 'NEWS_CREATED',
      object: `News:${news.id}`,
      after: { title: news.title, category: news.category, isPublished: news.isPublished },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({ success: true, data: news }, { status: 201 });
  } catch (error: any) {
    return errorResponse('Lỗi khi tạo tin tức', 500, error.message);
  }
}
