
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation
const pageBlockSchema = z.object({
  key: z.string().min(1, 'Key là bắt buộc'),
  title: z.string().optional(),
  titleEn: z.string().optional(),
  content: z.string().optional(),
  contentEn: z.string().optional(),
  imageUrl: z.string().optional(),
  blockType: z.string().default('text'),
  metadata: z.any().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/page-blocks - Lấy tất cả blocks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const key = searchParams.get('key');
    
    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
    }
    
    if (key) {
      where.key = key;
    }
    
    const blocks = await prisma.pageBlock.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        updatedByUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: blocks,
    });
  } catch (error: any) {
    console.error('Error fetching page blocks:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải page blocks', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/page-blocks - Tạo hoặc cập nhật block (admin only)
export async function POST(request: NextRequest) {
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
    
    if (!user || !['SYSADMIN', 'MANAGING_EDITOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền quản lý page blocks' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validated = pageBlockSchema.parse(body);
    
    // Upsert: tạo mới hoặc cập nhật nếu key đã tồn tại
    const block = await prisma.pageBlock.upsert({
      where: { key: validated.key },
      update: {
        ...validated,
        updatedBy: user.id,
      },
      create: {
        ...validated,
        updatedBy: user.id,
      },
      include: {
        updatedByUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lưu page block thành công',
      data: block,
    });
  } catch (error: any) {
    console.error('Error creating/updating page block:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu không hợp lệ', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Lỗi khi lưu page block', error: error.message },
      { status: 500 }
    );
  }
}
