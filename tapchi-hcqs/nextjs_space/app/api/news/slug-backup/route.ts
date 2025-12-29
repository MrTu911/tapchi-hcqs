
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation
const newsUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  titleEn: z.string().optional(),
  summary: z.string().optional(),
  summaryEn: z.string().optional(),
  content: z.string().optional(),
  contentEn: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(),
});

// GET /api/news/[slug] - Lấy chi tiết tin tức
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    const news = await prisma.news.findUnique({
      where: { slug },
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
    });
    
    if (!news) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy tin tức' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await prisma.news.update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    });
    
    return NextResponse.json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải tin tức', error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/news/[slug] - Cập nhật tin tức (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền truy cập' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.email! },
      select: { id: true, role: true },
    });
    
    if (!user || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền cập nhật tin tức' },
        { status: 403 }
      );
    }
    
    const { slug } = params;
    const body = await request.json();
    const validated = newsUpdateSchema.parse(body);
    
    const news = await prisma.news.findUnique({ where: { slug } });
    
    if (!news) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy tin tức' },
        { status: 404 }
      );
    }
    
    const updateData: any = { ...validated };
    
    // Handle publishedAt
    if (validated.publishedAt !== undefined) {
      updateData.publishedAt = validated.publishedAt ? new Date(validated.publishedAt) : null;
    }
    
    // Auto-set publishedAt if publishing for the first time
    if (validated.isPublished && !news.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    const updated = await prisma.news.update({
      where: { id: news.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật tin tức thành công',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating news:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu không hợp lệ', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật tin tức', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/news/[slug] - Xóa tin tức (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền truy cập' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.email! },
      select: { role: true },
    });
    
    if (!user || user.role !== 'SYSADMIN') {
      return NextResponse.json(
        { success: false, message: 'Chỉ SYSADMIN mới có quyền xóa tin tức' },
        { status: 403 }
      );
    }
    
    const { slug } = params;
    
    const news = await prisma.news.findUnique({ where: { slug } });
    
    if (!news) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy tin tức' },
        { status: 404 }
      );
    }
    
    await prisma.news.delete({ where: { id: news.id } });
    
    return NextResponse.json({
      success: true,
      message: 'Xóa tin tức thành công',
    });
  } catch (error: any) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xóa tin tức', error: error.message },
      { status: 500 }
    );
  }
}
